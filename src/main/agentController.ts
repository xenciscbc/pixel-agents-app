import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BrowserWindow, dialog } from 'electron';
import type { AgentState, MessageSender, PersistedAgent } from './types';
import { SessionWatcher, ActiveSession } from './sessionWatcher';
import { startFileWatching, readNewLines } from './fileWatcher';
import { cancelWaitingTimer, cancelPermissionTimer } from './timerManager';
import {
	loadFurnitureAssets, loadCharacterSprites, loadFloorTiles, loadWallTiles, loadDefaultLayout,
	sendAssetsToRenderer, sendCharacterSpritesToRenderer, sendFloorTilesToRenderer, sendWallTilesToRenderer,
} from './assetLoader';
import { loadLayout, writeLayoutToFile, readLayoutFromFile, watchLayoutFile, LayoutWatcher } from './layoutPersistence';
import {
	getSetting, setSetting,
	getWatchDirs, setWatchDirs, getActiveThreshold, setActiveThreshold, getScanInterval, setScanInterval,
	getViewMode, setViewMode, getDashboardLayout, setDashboardLayout,
	getAgentListPanelSize, setAgentListPanelSize,
	getFontScale, setFontScale,
	type WatchDir,
} from './settingsStore';
import {
	SETTINGS_KEY_AGENTS,
	SETTINGS_KEY_AGENT_SEATS,
	SETTINGS_KEY_SOUND_ENABLED,
} from './constants';

export class AgentController {
	private nextAgentId = { current: 1 };
	private agents = new Map<number, AgentState>();
	private fileWatchers = new Map<number, fs.FSWatcher>();
	private pollingTimers = new Map<number, ReturnType<typeof setInterval>>();
	private waitingTimers = new Map<number, ReturnType<typeof setTimeout>>();
	private jsonlPollTimers = new Map<number, ReturnType<typeof setInterval>>();
	private permissionTimers = new Map<number, ReturnType<typeof setTimeout>>();

	private defaultLayout: Record<string, unknown> | null = null;
	private layoutWatcher: LayoutWatcher | null = null;
	private sender: MessageSender | null = null;

	private sessionWatcher: SessionWatcher;
	private observeSessionMap = new Map<string, number>(); // sessionId → agentId
	private agentNumbers = new Map<number, number>(); // agentId → display number
	private usedNumbers = new Set<number>();

	constructor(private getWindow: () => BrowserWindow | null) {
		this.sessionWatcher = new SessionWatcher();
		this.sessionWatcher.onDiff((diff) => this.handleSessionDiff(diff));
	}

	private get messageSender(): MessageSender | undefined {
		if (this.sender) return this.sender;
		const win = this.getWindow();
		if (!win) return undefined;
		this.sender = {
			postMessage(msg: Record<string, unknown>): void {
				win.webContents.send('message', msg);
			},
		};
		return this.sender;
	}

	private persistAgents = (): void => {
		const persisted: PersistedAgent[] = [];
		for (const agent of this.agents.values()) {
			persisted.push({
				id: agent.id,
				mode: agent.mode,
				jsonlFile: agent.jsonlFile,
				projectDir: agent.projectDir,
			});
		}
		setSetting(SETTINGS_KEY_AGENTS, persisted);
	};

	// ── Message Handlers ────────────────────────────────────

	async handleMessage(msg: { type: string; [key: string]: unknown }): Promise<void> {
		switch (msg.type) {
			case 'webviewReady':
				await this.handleWebviewReady();
				break;
			case 'closeAgent':
				this.handleCloseAgent(msg.id as number);
				break;
			case 'focusAgent':
				// In standalone mode, no terminal to focus — could bring window to front
				break;
			case 'saveAgentSeats':
				setSetting(SETTINGS_KEY_AGENT_SEATS, msg.seats);
				break;
			case 'saveLayout':
				this.layoutWatcher?.markOwnWrite();
				writeLayoutToFile(msg.layout as Record<string, unknown>);
				break;
			case 'setSoundEnabled':
				setSetting(SETTINGS_KEY_SOUND_ENABLED, msg.enabled);
				break;
			case 'getAgentListPanelPos':
				this.messageSender?.postMessage({
					type: 'agentListPanelPosLoaded',
					pos: getSetting<{ x: number; y: number } | null>('agentListPanelPos', null),
				});
				break;
			case 'setAgentListPanelPos':
				setSetting('agentListPanelPos', msg.pos);
				break;
			case 'exportLayout':
				await this.handleExportLayout();
				break;
			case 'importLayout':
				await this.handleImportLayout();
				break;
			case 'getWatchDirs':
				this.messageSender?.postMessage({
					type: 'watchDirsLoaded',
					dirs: getWatchDirs(),
					threshold: getActiveThreshold(),
					scanInterval: getScanInterval(),
				});
				break;
			case 'addWatchDir': {
				const dirs = getWatchDirs();
				const newDir = msg.dir as WatchDir;
				if (!dirs.some(d => d.type === newDir.type && d.path === newDir.path)) {
					dirs.push(newDir);
					setWatchDirs(dirs);
				}
				this.messageSender?.postMessage({ type: 'watchDirsLoaded', dirs: getWatchDirs(), threshold: getActiveThreshold(), scanInterval: getScanInterval() });
				this.rescanSessions();
				break;
			}
			case 'removeWatchDir': {
				const dirs = getWatchDirs();
				const idx = msg.index as number;
				if (idx >= 0 && idx < dirs.length) {
					dirs.splice(idx, 1);
					setWatchDirs(dirs);
				}
				this.messageSender?.postMessage({ type: 'watchDirsLoaded', dirs: getWatchDirs(), threshold: getActiveThreshold(), scanInterval: getScanInterval() });
				this.rescanSessions();
				break;
			}
			case 'setActiveThreshold':
				setActiveThreshold(msg.minutes as number);
				this.rescanSessions();
				break;
			case 'setScanInterval':
				setScanInterval(msg.seconds as number);
				this.sessionWatcher.restartTimer();
				break;
			case 'setViewMode':
				setViewMode(msg.mode as 'office' | 'dashboard');
				break;
			case 'setDashboardLayout':
				setDashboardLayout(msg.layout as 'grid' | 'list');
				break;
			case 'getViewModeSettings':
				this.messageSender?.postMessage({
					type: 'viewModeSettingsLoaded',
					viewMode: getViewMode(),
					dashboardLayout: getDashboardLayout(),
				});
				break;
			case 'setAgentListPanelSize':
				setAgentListPanelSize(msg.size as { width: number; height: number });
				break;
			case 'getAgentListPanelSize':
				this.messageSender?.postMessage({
					type: 'agentListPanelSizeLoaded',
					size: getAgentListPanelSize(),
				});
				break;
			case 'setFontScale': {
				const scale = msg.scale as number;
				setFontScale(scale);
				this.messageSender?.postMessage({ type: 'fontScaleLoaded', fontScale: scale });
				break;
			}
			case 'getFontScale':
				this.messageSender?.postMessage({
					type: 'fontScaleLoaded',
					fontScale: getFontScale(),
				});
				break;
			case 'selectProjectDir': {
				const win = this.getWindow();
				if (!win) break;
				const result = await dialog.showOpenDialog(win, {
					properties: ['openDirectory'],
					title: 'Select Project Directory',
				});
				if (!result.canceled && result.filePaths.length > 0) {
					this.messageSender?.postMessage({ type: 'projectDirSelected', path: result.filePaths[0] });
				}
				break;
			}
		}
	}

	private async handleWebviewReady(): Promise<void> {
		const sender = this.messageSender;
		if (!sender) return;

		// Restore agents
		this.restoreAgents();

		// Send settings
		const soundEnabled = getSetting<boolean>(SETTINGS_KEY_SOUND_ENABLED, true);
		sender.postMessage({ type: 'settingsLoaded', soundEnabled });
		sender.postMessage({
			type: 'viewModeSettingsLoaded',
			viewMode: getViewMode(),
			dashboardLayout: getDashboardLayout(),
		});
		sender.postMessage({
			type: 'agentListPanelSizeLoaded',
			size: getAgentListPanelSize(),
		});
		sender.postMessage({
			type: 'fontScaleLoaded',
			fontScale: getFontScale(),
		});

		// Load and send assets
		const assetsRoot = this.getAssetsRoot();
		if (assetsRoot) {
			this.defaultLayout = loadDefaultLayout(assetsRoot);

			const charSprites = await loadCharacterSprites(assetsRoot);
			if (charSprites) sendCharacterSpritesToRenderer(sender, charSprites);

			const floorTiles = await loadFloorTiles(assetsRoot);
			if (floorTiles) sendFloorTilesToRenderer(sender, floorTiles);

			const wallTiles = await loadWallTiles(assetsRoot);
			if (wallTiles) sendWallTilesToRenderer(sender, wallTiles);

			const furniture = await loadFurnitureAssets(assetsRoot);
			if (furniture) sendAssetsToRenderer(sender, furniture);
		}

		// Send layout
		const layout = loadLayout(this.defaultLayout);
		sender.postMessage({ type: 'layoutLoaded', layout });
		this.startLayoutWatcher();

		// Send existing agents
		this.sendExistingAgents();

		// Start session watcher for observe mode
		this.startWatching();
	}

	private handleCloseAgent(agentId: number): void {
		const agent = this.agents.get(agentId);
		if (!agent) return;
		if (agent.processRef) {
			try { agent.processRef.kill(); } catch { /* already dead */ }
		}
		this.removeAgent(agentId);
		this.messageSender?.postMessage({ type: 'agentClosed', id: agentId });
	}

	private removeAgent(agentId: number): void {
		const agent = this.agents.get(agentId);
		if (!agent) return;

		const jpTimer = this.jsonlPollTimers.get(agentId);
		if (jpTimer) clearInterval(jpTimer);
		this.jsonlPollTimers.delete(agentId);

		this.fileWatchers.get(agentId)?.close();
		this.fileWatchers.delete(agentId);
		const pt = this.pollingTimers.get(agentId);
		if (pt) clearInterval(pt);
		this.pollingTimers.delete(agentId);

		cancelWaitingTimer(agentId, this.waitingTimers);
		cancelPermissionTimer(agentId, this.permissionTimers);

		this.agents.delete(agentId);
		this.persistAgents();
	}

	private restoreAgents(): void {
		const sender = this.messageSender;
		const persisted = getSetting<PersistedAgent[]>(SETTINGS_KEY_AGENTS, []);
		if (persisted.length === 0) return;

		let maxId = 0;

		for (const p of persisted) {
			// In standalone mode, we can only restore agents whose JSONL files exist
			// (we can't match running processes like VSCode matches terminals)
			if (!fs.existsSync(p.jsonlFile)) continue;

			const agent: AgentState = {
				id: p.id,
				mode: p.mode || 'managed',
				processRef: null, // No running process — monitor-only mode
				projectDir: p.projectDir,
				jsonlFile: p.jsonlFile,
				fileOffset: 0,
				lineBuffer: '',
				activeToolIds: new Set(),
				activeToolStatuses: new Map(),
				activeToolNames: new Map(),
				activeSubagentToolIds: new Map(),
				activeSubagentToolNames: new Map(),
				isWaiting: false,
				permissionSent: false,
				hadToolsInTurn: false,
			};

			this.agents.set(p.id, agent);

			if (p.id > maxId) maxId = p.id;

			try {
				const stat = fs.statSync(p.jsonlFile);
				agent.fileOffset = stat.size;
				startFileWatching(p.id, p.jsonlFile, this.agents, this.fileWatchers, this.pollingTimers, this.waitingTimers, this.permissionTimers, sender);
			} catch { /* ignore */ }
		}

		if (maxId >= this.nextAgentId.current) {
			this.nextAgentId.current = maxId + 1;
		}

		this.persistAgents();
	}

	private sendExistingAgents(): void {
		const sender = this.messageSender;
		if (!sender) return;

		const agentIds = [...this.agents.keys()].sort((a, b) => a - b);
		const agentMeta = getSetting<Record<string, { palette?: number; hueShift?: number; seatId?: string }>>(SETTINGS_KEY_AGENT_SEATS, {});

		sender.postMessage({
			type: 'existingAgents',
			agents: agentIds,
			agentMeta,
		});

		// Re-send current statuses
		for (const [agentId, agent] of this.agents) {
			for (const [toolId, status] of agent.activeToolStatuses) {
				sender.postMessage({ type: 'agentToolStart', id: agentId, toolId, status });
			}
			if (agent.isWaiting) {
				sender.postMessage({ type: 'agentStatus', id: agentId, status: 'waiting' });
			}
		}
	}

	private async handleExportLayout(): Promise<void> {
		const win = this.getWindow();
		if (!win) return;
		const layout = readLayoutFromFile();
		if (!layout) return;

		const result = await dialog.showSaveDialog(win, {
			filters: [{ name: 'JSON Files', extensions: ['json'] }],
			defaultPath: path.join(os.homedir(), 'pixel-agents-layout.json'),
		});
		if (result.canceled || !result.filePath) return;
		fs.writeFileSync(result.filePath, JSON.stringify(layout, null, 2), 'utf-8');
	}

	private async handleImportLayout(): Promise<void> {
		const win = this.getWindow();
		const sender = this.messageSender;
		if (!win || !sender) return;

		const result = await dialog.showOpenDialog(win, {
			filters: [{ name: 'JSON Files', extensions: ['json'] }],
			properties: ['openFile'],
		});
		if (result.canceled || result.filePaths.length === 0) return;

		try {
			const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
			const imported = JSON.parse(raw) as Record<string, unknown>;
			if (imported.version !== 1 || !Array.isArray(imported.tiles)) return;

			this.layoutWatcher?.markOwnWrite();
			writeLayoutToFile(imported);
			sender.postMessage({ type: 'layoutLoaded', layout: imported });
		} catch { /* invalid file */ }
	}

	private getAssetsRoot(): string | null {
		// Check for bundled assets in resources
		const resourcesPath = path.join(process.resourcesPath || path.join(__dirname, '..', '..'), 'assets');
		if (fs.existsSync(resourcesPath)) return resourcesPath;

		// Development: check project root
		const devPath = path.join(__dirname, '..', '..', 'resources', 'assets');
		if (fs.existsSync(devPath)) return devPath;

		return null;
	}

	private startLayoutWatcher(): void {
		if (this.layoutWatcher) return;
		this.layoutWatcher = watchLayoutFile((layout) => {
			this.messageSender?.postMessage({ type: 'layoutLoaded', layout });
		});
	}

	// ── Observe Agent Methods ────────────────────────────────

	private allocateNumber(): number {
		let n = 1;
		while (this.usedNumbers.has(n)) n++;
		this.usedNumbers.add(n);
		return n;
	}

	private releaseNumber(n: number): void {
		this.usedNumbers.delete(n);
	}

	addObserveAgent(session: ActiveSession): void {
		const sender = this.messageSender;
		if (this.observeSessionMap.has(session.id)) return;

		const id = this.nextAgentId.current++;
		const num = this.allocateNumber();

		const agent: AgentState = {
			id,
			mode: 'observe',
			processRef: null,
			projectDir: session.projectDir,
			jsonlFile: session.jsonlPath,
			fileOffset: 0,
			lineBuffer: '',
			activeToolIds: new Set(),
			activeToolStatuses: new Map(),
			activeToolNames: new Map(),
			activeSubagentToolIds: new Map(),
			activeSubagentToolNames: new Map(),
			isWaiting: false,
			permissionSent: false,
			hadToolsInTurn: false,
		};

		this.agents.set(id, agent);
		this.observeSessionMap.set(session.id, id);
		this.agentNumbers.set(id, num);

		sender?.postMessage({ type: 'agentCreated', id, label: `Agent #${num}`, mode: 'observe', projectDir: session.projectDir });

		// Start tailing the JSONL
		try {
			const stat = fs.statSync(session.jsonlPath);
			agent.fileOffset = stat.size;
			startFileWatching(id, session.jsonlPath, this.agents, this.fileWatchers, this.pollingTimers, this.waitingTimers, this.permissionTimers, sender);
		} catch { /* file may vanish */ }
	}

	removeObserveAgent(sessionId: string): void {
		const agentId = this.observeSessionMap.get(sessionId);
		if (agentId === undefined) return;

		this.observeSessionMap.delete(sessionId);
		const num = this.agentNumbers.get(agentId);
		if (num !== undefined) this.releaseNumber(num);
		this.agentNumbers.delete(agentId);
		this.removeAgent(agentId);
		this.messageSender?.postMessage({ type: 'agentClosed', id: agentId });
	}

	private handleSessionDiff(diff: { added: ActiveSession[]; removed: string[] }): void {
		for (const session of diff.added) {
			this.addObserveAgent(session);
		}
		for (const sessionId of diff.removed) {
			this.removeObserveAgent(sessionId);
		}
	}

	/** Start the session watcher (call after webview is ready) */
	startWatching(): void {
		this.sessionWatcher.start();
	}

	/** Trigger a re-scan (e.g. after settings change) */
	rescanSessions(): void {
		this.sessionWatcher.rescan();
	}

	dispose(): void {
		this.sessionWatcher.stop();
		this.layoutWatcher?.dispose();
		this.layoutWatcher = null;

		for (const [id, agent] of this.agents) {
			if (agent.processRef) {
				try { agent.processRef.kill(); } catch { /* ignore */ }
			}
			this.removeAgent(id);
		}

	}
}
