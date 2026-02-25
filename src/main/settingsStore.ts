import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface WatchDir {
	type: 'claude-root' | 'project';
	path: string;
}

export const SETTINGS_KEY_WATCH_DIRS = 'watchDirs';
export const SETTINGS_KEY_ACTIVE_THRESHOLD = 'activeThresholdMinutes';
export const SETTINGS_KEY_SCAN_INTERVAL = 'scanIntervalSeconds';
export const SETTINGS_KEY_DEV_PORT = 'devPort';

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
