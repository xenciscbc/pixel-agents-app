"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentController = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const electron_1 = require("electron");
const sessionWatcher_1 = require("./sessionWatcher");
const fileWatcher_1 = require("./fileWatcher");
const timerManager_1 = require("./timerManager");
const assetLoader_1 = require("./assetLoader");
const layoutPersistence_1 = require("./layoutPersistence");
const settingsStore_1 = require("./settingsStore");
const constants_1 = require("./constants");
class AgentController {
    getWindow;
    nextAgentId = { current: 1 };
    agents = new Map();
    fileWatchers = new Map();
    pollingTimers = new Map();
    waitingTimers = new Map();
    jsonlPollTimers = new Map();
    permissionTimers = new Map();
    defaultLayout = null;
    layoutWatcher = null;
    sender = null;
    sessionWatcher;
    observeSessionMap = new Map(); // sessionId → agentId
    agentNumbers = new Map(); // agentId → display number
    usedNumbers = new Set();
    constructor(getWindow) {
        this.getWindow = getWindow;
        this.sessionWatcher = new sessionWatcher_1.SessionWatcher();
        this.sessionWatcher.onDiff((diff) => this.handleSessionDiff(diff));
    }
    get messageSender() {
        if (this.sender)
            return this.sender;
        const win = this.getWindow();
        if (!win)
            return undefined;
        this.sender = {
            postMessage(msg) {
                win.webContents.send('message', msg);
            },
        };
        return this.sender;
    }
    persistAgents = () => {
        const persisted = [];
        for (const agent of this.agents.values()) {
            persisted.push({
                id: agent.id,
                mode: agent.mode,
                jsonlFile: agent.jsonlFile,
                projectDir: agent.projectDir,
            });
        }
        (0, settingsStore_1.setSetting)(constants_1.SETTINGS_KEY_AGENTS, persisted);
    };
    // ── Message Handlers ────────────────────────────────────
    async handleMessage(msg) {
        switch (msg.type) {
            case 'webviewReady':
                await this.handleWebviewReady();
                break;
            case 'closeAgent':
                this.handleCloseAgent(msg.id);
                break;
            case 'focusAgent':
                // In standalone mode, no terminal to focus — could bring window to front
                break;
            case 'saveAgentSeats':
                (0, settingsStore_1.setSetting)(constants_1.SETTINGS_KEY_AGENT_SEATS, msg.seats);
                break;
            case 'saveLayout':
                this.layoutWatcher?.markOwnWrite();
                (0, layoutPersistence_1.writeLayoutToFile)(msg.layout);
                break;
            case 'setSoundEnabled':
                (0, settingsStore_1.setSetting)(constants_1.SETTINGS_KEY_SOUND_ENABLED, msg.enabled);
                break;
            case 'getAgentListPanelPos':
                this.messageSender?.postMessage({
                    type: 'agentListPanelPosLoaded',
                    pos: (0, settingsStore_1.getSetting)('agentListPanelPos', null),
                });
                break;
            case 'setAgentListPanelPos':
                (0, settingsStore_1.setSetting)('agentListPanelPos', msg.pos);
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
                    dirs: (0, settingsStore_1.getWatchDirs)(),
                    threshold: (0, settingsStore_1.getActiveThreshold)(),
                    scanInterval: (0, settingsStore_1.getScanInterval)(),
                });
                break;
            case 'addWatchDir': {
                const dirs = (0, settingsStore_1.getWatchDirs)();
                const newDir = msg.dir;
                if (!dirs.some(d => d.type === newDir.type && d.path === newDir.path)) {
                    dirs.push(newDir);
                    (0, settingsStore_1.setWatchDirs)(dirs);
                }
                this.messageSender?.postMessage({ type: 'watchDirsLoaded', dirs: (0, settingsStore_1.getWatchDirs)(), threshold: (0, settingsStore_1.getActiveThreshold)(), scanInterval: (0, settingsStore_1.getScanInterval)() });
                this.rescanSessions();
                break;
            }
            case 'removeWatchDir': {
                const dirs = (0, settingsStore_1.getWatchDirs)();
                const idx = msg.index;
                if (idx >= 0 && idx < dirs.length) {
                    dirs.splice(idx, 1);
                    (0, settingsStore_1.setWatchDirs)(dirs);
                }
                this.messageSender?.postMessage({ type: 'watchDirsLoaded', dirs: (0, settingsStore_1.getWatchDirs)(), threshold: (0, settingsStore_1.getActiveThreshold)(), scanInterval: (0, settingsStore_1.getScanInterval)() });
                this.rescanSessions();
                break;
            }
            case 'setActiveThreshold':
                (0, settingsStore_1.setActiveThreshold)(msg.minutes);
                this.rescanSessions();
                break;
            case 'setScanInterval':
                (0, settingsStore_1.setScanInterval)(msg.seconds);
                this.sessionWatcher.restartTimer();
                break;
            case 'setViewMode':
                (0, settingsStore_1.setViewMode)(msg.mode);
                break;
            case 'setDashboardLayout':
                (0, settingsStore_1.setDashboardLayout)(msg.layout);
                break;
            case 'getViewModeSettings':
                this.messageSender?.postMessage({
                    type: 'viewModeSettingsLoaded',
                    viewMode: (0, settingsStore_1.getViewMode)(),
                    dashboardLayout: (0, settingsStore_1.getDashboardLayout)(),
                });
                break;
            case 'setAgentListPanelSize':
                (0, settingsStore_1.setAgentListPanelSize)(msg.size);
                break;
            case 'getAgentListPanelSize':
                this.messageSender?.postMessage({
                    type: 'agentListPanelSizeLoaded',
                    size: (0, settingsStore_1.getAgentListPanelSize)(),
                });
                break;
            case 'selectProjectDir': {
                const win = this.getWindow();
                if (!win)
                    break;
                const result = await electron_1.dialog.showOpenDialog(win, {
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
    async handleWebviewReady() {
        const sender = this.messageSender;
        if (!sender)
            return;
        // Restore agents
        this.restoreAgents();
        // Send settings
        const soundEnabled = (0, settingsStore_1.getSetting)(constants_1.SETTINGS_KEY_SOUND_ENABLED, true);
        sender.postMessage({ type: 'settingsLoaded', soundEnabled });
        sender.postMessage({
            type: 'viewModeSettingsLoaded',
            viewMode: (0, settingsStore_1.getViewMode)(),
            dashboardLayout: (0, settingsStore_1.getDashboardLayout)(),
        });
        sender.postMessage({
            type: 'agentListPanelSizeLoaded',
            size: (0, settingsStore_1.getAgentListPanelSize)(),
        });
        // Load and send assets
        const assetsRoot = this.getAssetsRoot();
        if (assetsRoot) {
            this.defaultLayout = (0, assetLoader_1.loadDefaultLayout)(assetsRoot);
            const charSprites = await (0, assetLoader_1.loadCharacterSprites)(assetsRoot);
            if (charSprites)
                (0, assetLoader_1.sendCharacterSpritesToRenderer)(sender, charSprites);
            const floorTiles = await (0, assetLoader_1.loadFloorTiles)(assetsRoot);
            if (floorTiles)
                (0, assetLoader_1.sendFloorTilesToRenderer)(sender, floorTiles);
            const wallTiles = await (0, assetLoader_1.loadWallTiles)(assetsRoot);
            if (wallTiles)
                (0, assetLoader_1.sendWallTilesToRenderer)(sender, wallTiles);
            const furniture = await (0, assetLoader_1.loadFurnitureAssets)(assetsRoot);
            if (furniture)
                (0, assetLoader_1.sendAssetsToRenderer)(sender, furniture);
        }
        // Send layout
        const layout = (0, layoutPersistence_1.loadLayout)(this.defaultLayout);
        sender.postMessage({ type: 'layoutLoaded', layout });
        this.startLayoutWatcher();
        // Send existing agents
        this.sendExistingAgents();
        // Start session watcher for observe mode
        this.startWatching();
    }
    handleCloseAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        if (agent.processRef) {
            try {
                agent.processRef.kill();
            }
            catch { /* already dead */ }
        }
        this.removeAgent(agentId);
        this.messageSender?.postMessage({ type: 'agentClosed', id: agentId });
    }
    removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        const jpTimer = this.jsonlPollTimers.get(agentId);
        if (jpTimer)
            clearInterval(jpTimer);
        this.jsonlPollTimers.delete(agentId);
        this.fileWatchers.get(agentId)?.close();
        this.fileWatchers.delete(agentId);
        const pt = this.pollingTimers.get(agentId);
        if (pt)
            clearInterval(pt);
        this.pollingTimers.delete(agentId);
        (0, timerManager_1.cancelWaitingTimer)(agentId, this.waitingTimers);
        (0, timerManager_1.cancelPermissionTimer)(agentId, this.permissionTimers);
        this.agents.delete(agentId);
        this.persistAgents();
    }
    restoreAgents() {
        const sender = this.messageSender;
        const persisted = (0, settingsStore_1.getSetting)(constants_1.SETTINGS_KEY_AGENTS, []);
        if (persisted.length === 0)
            return;
        let maxId = 0;
        for (const p of persisted) {
            // In standalone mode, we can only restore agents whose JSONL files exist
            // (we can't match running processes like VSCode matches terminals)
            if (!fs.existsSync(p.jsonlFile))
                continue;
            const agent = {
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
            if (p.id > maxId)
                maxId = p.id;
            try {
                const stat = fs.statSync(p.jsonlFile);
                agent.fileOffset = stat.size;
                (0, fileWatcher_1.startFileWatching)(p.id, p.jsonlFile, this.agents, this.fileWatchers, this.pollingTimers, this.waitingTimers, this.permissionTimers, sender);
            }
            catch { /* ignore */ }
        }
        if (maxId >= this.nextAgentId.current) {
            this.nextAgentId.current = maxId + 1;
        }
        this.persistAgents();
    }
    sendExistingAgents() {
        const sender = this.messageSender;
        if (!sender)
            return;
        const agentIds = [...this.agents.keys()].sort((a, b) => a - b);
        const agentMeta = (0, settingsStore_1.getSetting)(constants_1.SETTINGS_KEY_AGENT_SEATS, {});
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
    async handleExportLayout() {
        const win = this.getWindow();
        if (!win)
            return;
        const layout = (0, layoutPersistence_1.readLayoutFromFile)();
        if (!layout)
            return;
        const result = await electron_1.dialog.showSaveDialog(win, {
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
            defaultPath: path.join(os.homedir(), 'pixel-agents-layout.json'),
        });
        if (result.canceled || !result.filePath)
            return;
        fs.writeFileSync(result.filePath, JSON.stringify(layout, null, 2), 'utf-8');
    }
    async handleImportLayout() {
        const win = this.getWindow();
        const sender = this.messageSender;
        if (!win || !sender)
            return;
        const result = await electron_1.dialog.showOpenDialog(win, {
            filters: [{ name: 'JSON Files', extensions: ['json'] }],
            properties: ['openFile'],
        });
        if (result.canceled || result.filePaths.length === 0)
            return;
        try {
            const raw = fs.readFileSync(result.filePaths[0], 'utf-8');
            const imported = JSON.parse(raw);
            if (imported.version !== 1 || !Array.isArray(imported.tiles))
                return;
            this.layoutWatcher?.markOwnWrite();
            (0, layoutPersistence_1.writeLayoutToFile)(imported);
            sender.postMessage({ type: 'layoutLoaded', layout: imported });
        }
        catch { /* invalid file */ }
    }
    getAssetsRoot() {
        // Check for bundled assets in resources
        const resourcesPath = path.join(process.resourcesPath || path.join(__dirname, '..', '..'), 'assets');
        if (fs.existsSync(resourcesPath))
            return resourcesPath;
        // Development: check project root
        const devPath = path.join(__dirname, '..', '..', 'resources', 'assets');
        if (fs.existsSync(devPath))
            return devPath;
        return null;
    }
    startLayoutWatcher() {
        if (this.layoutWatcher)
            return;
        this.layoutWatcher = (0, layoutPersistence_1.watchLayoutFile)((layout) => {
            this.messageSender?.postMessage({ type: 'layoutLoaded', layout });
        });
    }
    // ── Observe Agent Methods ────────────────────────────────
    allocateNumber() {
        let n = 1;
        while (this.usedNumbers.has(n))
            n++;
        this.usedNumbers.add(n);
        return n;
    }
    releaseNumber(n) {
        this.usedNumbers.delete(n);
    }
    addObserveAgent(session) {
        const sender = this.messageSender;
        if (this.observeSessionMap.has(session.id))
            return;
        const id = this.nextAgentId.current++;
        const num = this.allocateNumber();
        const agent = {
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
            (0, fileWatcher_1.startFileWatching)(id, session.jsonlPath, this.agents, this.fileWatchers, this.pollingTimers, this.waitingTimers, this.permissionTimers, sender);
        }
        catch { /* file may vanish */ }
    }
    removeObserveAgent(sessionId) {
        const agentId = this.observeSessionMap.get(sessionId);
        if (agentId === undefined)
            return;
        this.observeSessionMap.delete(sessionId);
        const num = this.agentNumbers.get(agentId);
        if (num !== undefined)
            this.releaseNumber(num);
        this.agentNumbers.delete(agentId);
        this.removeAgent(agentId);
        this.messageSender?.postMessage({ type: 'agentClosed', id: agentId });
    }
    handleSessionDiff(diff) {
        for (const session of diff.added) {
            this.addObserveAgent(session);
        }
        for (const sessionId of diff.removed) {
            this.removeObserveAgent(sessionId);
        }
    }
    /** Start the session watcher (call after webview is ready) */
    startWatching() {
        this.sessionWatcher.start();
    }
    /** Trigger a re-scan (e.g. after settings change) */
    rescanSessions() {
        this.sessionWatcher.rescan();
    }
    dispose() {
        this.sessionWatcher.stop();
        this.layoutWatcher?.dispose();
        this.layoutWatcher = null;
        for (const [id, agent] of this.agents) {
            if (agent.processRef) {
                try {
                    agent.processRef.kill();
                }
                catch { /* ignore */ }
            }
            this.removeAgent(id);
        }
    }
}
exports.AgentController = AgentController;
//# sourceMappingURL=agentController.js.map