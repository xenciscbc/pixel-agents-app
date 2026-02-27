import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { app } from 'electron';

export interface WatchDir {
	type: 'claude-root' | 'project';
	path: string;
}

export const SETTINGS_KEY_WATCH_DIRS = 'watchDirs';
export const SETTINGS_KEY_ACTIVE_THRESHOLD = 'activeThresholdMinutes';
export const SETTINGS_KEY_SCAN_INTERVAL = 'scanIntervalSeconds';
export const SETTINGS_KEY_DEV_PORT = 'devPort';
export const SETTINGS_KEY_VIEW_MODE = 'viewMode';
export const SETTINGS_KEY_DASHBOARD_LAYOUT = 'dashboardLayout';
export const SETTINGS_KEY_AGENT_LIST_PANEL_SIZE = 'agentListPanelSize';
export const SETTINGS_KEY_FONT_SCALE = 'fontScale';
export const SETTINGS_KEY_ALWAYS_ON_TOP = 'alwaysOnTop';
export const SETTINGS_KEY_PEER_NAME = 'peerName';
export const SETTINGS_KEY_BROADCAST_ENABLED = 'broadcastEnabled';
export const SETTINGS_KEY_UDP_PORT = 'udpPort';
export const SETTINGS_KEY_HEARTBEAT_INTERVAL = 'heartbeatInterval';
export const SETTINGS_KEY_SOUND_SETTINGS = 'soundSettings';

export interface SoundSettings {
	enabled: boolean;
	waiting: boolean;
	rest: boolean;
	needsApproval: boolean;
	idle: boolean;
}

let settingsCache: Record<string, unknown> | null = null;

function getSettingsPath(): string {
	return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): Record<string, unknown> {
	if (settingsCache) return settingsCache;
	try {
		const p = getSettingsPath();
		if (fs.existsSync(p)) {
			settingsCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
			return settingsCache!;
		}
	} catch { /* start fresh */ }
	settingsCache = {};
	return settingsCache;
}

function saveSettings(): void {
	try {
		const p = getSettingsPath();
		const dir = path.dirname(p);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(p, JSON.stringify(settingsCache || {}, null, 2), 'utf-8');
	} catch (err) {
		console.error('[Settings] Failed to save:', err);
	}
}

export function getSetting<T>(key: string, defaultValue: T): T {
	const settings = loadSettings();
	return (key in settings ? settings[key] : defaultValue) as T;
}

export function setSetting(key: string, value: unknown): void {
	const settings = loadSettings();
	settings[key] = value;
	saveSettings();
}

export function getWatchDirs(): WatchDir[] {
	return getSetting<WatchDir[]>(SETTINGS_KEY_WATCH_DIRS, []);
}

export function setWatchDirs(dirs: WatchDir[]): void {
	setSetting(SETTINGS_KEY_WATCH_DIRS, dirs);
}

export function getActiveThreshold(): number {
	return getSetting<number>(SETTINGS_KEY_ACTIVE_THRESHOLD, 30);
}

export function setActiveThreshold(minutes: number): void {
	setSetting(SETTINGS_KEY_ACTIVE_THRESHOLD, minutes);
}

export function getScanInterval(): number {
	return getSetting<number>(SETTINGS_KEY_SCAN_INTERVAL, 30);
}

export function setScanInterval(seconds: number): void {
	setSetting(SETTINGS_KEY_SCAN_INTERVAL, seconds);
}

export function getDevPort(): number {
	return getSetting<number>(SETTINGS_KEY_DEV_PORT, 5173);
}

export type ViewMode = 'office' | 'dashboard';
export type DashboardLayout = 'grid' | 'list';

export function getViewMode(): ViewMode {
	return getSetting<ViewMode>(SETTINGS_KEY_VIEW_MODE, 'office');
}

export function setViewMode(mode: ViewMode): void {
	setSetting(SETTINGS_KEY_VIEW_MODE, mode);
}

export function getDashboardLayout(): DashboardLayout {
	return getSetting<DashboardLayout>(SETTINGS_KEY_DASHBOARD_LAYOUT, 'grid');
}

export function setDashboardLayout(layout: DashboardLayout): void {
	setSetting(SETTINGS_KEY_DASHBOARD_LAYOUT, layout);
}

export function getAgentListPanelSize(): { width: number; height: number } {
	return getSetting<{ width: number; height: number }>(SETTINGS_KEY_AGENT_LIST_PANEL_SIZE, { width: 220, height: 300 });
}

export function setAgentListPanelSize(size: { width: number; height: number }): void {
	setSetting(SETTINGS_KEY_AGENT_LIST_PANEL_SIZE, size);
}

export function getFontScale(): number {
	return getSetting<number>(SETTINGS_KEY_FONT_SCALE, 1.0);
}

export function setFontScale(scale: number): void {
	setSetting(SETTINGS_KEY_FONT_SCALE, scale);
}

export function getAlwaysOnTop(): boolean {
	return getSetting<boolean>(SETTINGS_KEY_ALWAYS_ON_TOP, false);
}

export function setAlwaysOnTop(value: boolean): void {
	setSetting(SETTINGS_KEY_ALWAYS_ON_TOP, value);
}

export function getPeerName(): string {
	return getSetting<string>(SETTINGS_KEY_PEER_NAME, os.hostname());
}

export function setPeerName(name: string): void {
	setSetting(SETTINGS_KEY_PEER_NAME, name);
}

export function getBroadcastEnabled(): boolean {
	return getSetting<boolean>(SETTINGS_KEY_BROADCAST_ENABLED, true);
}

export function setBroadcastEnabled(value: boolean): void {
	setSetting(SETTINGS_KEY_BROADCAST_ENABLED, value);
}

export function getUdpPort(): number {
	return getSetting<number>(SETTINGS_KEY_UDP_PORT, 47800);
}

export function setUdpPort(port: number): void {
	setSetting(SETTINGS_KEY_UDP_PORT, port);
}

export function getHeartbeatInterval(): number {
	return getSetting<number>(SETTINGS_KEY_HEARTBEAT_INTERVAL, getScanInterval());
}

export function setHeartbeatInterval(seconds: number): void {
	setSetting(SETTINGS_KEY_HEARTBEAT_INTERVAL, seconds);
}

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
	enabled: true,
	waiting: true,
	rest: true,
	needsApproval: true,
	idle: false,
};

export function getSoundSettings(): SoundSettings {
	const stored = getSetting<SoundSettings | null>(SETTINGS_KEY_SOUND_SETTINGS, null);
	if (stored) return { ...DEFAULT_SOUND_SETTINGS, ...stored };
	// Fallback: read legacy soundEnabled key
	const legacyEnabled = getSetting<boolean>('soundEnabled', true);
	return { ...DEFAULT_SOUND_SETTINGS, enabled: legacyEnabled };
}

export function setSoundSettings(settings: SoundSettings): void {
	setSetting(SETTINGS_KEY_SOUND_SETTINGS, settings);
}
