import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { WatchDir, getWatchDirs, getActiveThreshold, getScanInterval } from './settingsStore';

export interface ActiveSession {
	id: string;          // unique key: dirName/filename
	jsonlPath: string;
	mtime: number;
	projectDir: string;  // parent directory name (for display)
}

export interface ScanDiff {
	added: ActiveSession[];
	removed: string[];   // session ids
}

type ScanListener = (diff: ScanDiff) => void;

export class SessionWatcher {
	private knownSessions = new Map<string, ActiveSession>();
	private timer: ReturnType<typeof setInterval> | null = null;
	private listeners: ScanListener[] = [];

	onDiff(listener: ScanListener): void {
		this.listeners.push(listener);
	}

	start(): void {
		this.scan();
		const intervalMs = getScanInterval() * 1000;
		this.timer = setInterval(() => this.scan(), intervalMs);
	}

	/** Restart the timer with current settings (call after interval changes) */
	restartTimer(): void {
		if (this.timer) {
			clearInterval(this.timer);
		}
		const intervalMs = getScanInterval() * 1000;
		this.timer = setInterval(() => this.scan(), intervalMs);
	}

	stop(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		this.knownSessions.clear();
	}

	/** Force an immediate re-scan (e.g. after settings change) */
	rescan(): void {
		this.scan();
	}

	private scan(): void {
		const watchDirs = getWatchDirs();
		const threshold = getActiveThreshold();
		const cutoff = Date.now() - threshold * 60_000;

		const found = new Map<string, ActiveSession>();

		for (const dir of watchDirs) {
			const expandedPath = expandPath(dir.path);
			if (dir.type === 'claude-root') {
				this.scanClaudeRoot(expandedPath, cutoff, found);
			} else {
				this.scanProjectDir(expandedPath, cutoff, found);
			}
		}

		// Diff
		const added: ActiveSession[] = [];
		const removed: string[] = [];

		for (const [id, session] of found) {
			if (!this.knownSessions.has(id)) {
				added.push(session);
			}
		}
		for (const id of this.knownSessions.keys()) {
			if (!found.has(id)) {
				removed.push(id);
			}
		}

		this.knownSessions = found;

		if (added.length > 0 || removed.length > 0) {
			for (const listener of this.listeners) {
				listener({ added, removed });
			}
		}
	}

	private scanClaudeRoot(rootPath: string, cutoff: number, found: Map<string, ActiveSession>): void {
		if (!fs.existsSync(rootPath)) return;
		let entries: string[];
		try {
			entries = fs.readdirSync(rootPath);
		} catch { return; }

		for (const entry of entries) {
			const subdir = path.join(rootPath, entry);
			try {
				if (!fs.statSync(subdir).isDirectory()) continue;
			} catch { continue; }
			this.scanProjectDir(subdir, cutoff, found, entry);
		}
	}

	private scanProjectDir(dirPath: string, cutoff: number, found: Map<string, ActiveSession>, projectLabel?: string): void {
		if (!fs.existsSync(dirPath)) return;
		let files: string[];
		try {
			files = fs.readdirSync(dirPath);
		} catch { return; }

		const label = projectLabel || path.basename(dirPath);

		for (const file of files) {
			if (!file.endsWith('.jsonl')) continue;
			const fullPath = path.join(dirPath, file);
			try {
				const stat = fs.statSync(fullPath);
				if (stat.mtimeMs < cutoff) continue;

				const id = `${label}/${file}`;
				found.set(id, {
					id,
					jsonlPath: fullPath,
					mtime: stat.mtimeMs,
					projectDir: label,
				});
			} catch { continue; }
		}
	}
}

/** Expand ~ to home directory, normalize path separators */
export function expandPath(p: string): string {
	if (p.startsWith('~')) {
		p = path.join(os.homedir(), p.slice(1));
	}
	return path.normalize(p);
}
