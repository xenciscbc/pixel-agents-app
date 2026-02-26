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
exports.SessionWatcher = void 0;
exports.expandPath = expandPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const settingsStore_1 = require("./settingsStore");
class SessionWatcher {
    knownSessions = new Map();
    timer = null;
    listeners = [];
    onDiff(listener) {
        this.listeners.push(listener);
    }
    start() {
        this.scan();
        const intervalMs = (0, settingsStore_1.getScanInterval)() * 1000;
        this.timer = setInterval(() => this.scan(), intervalMs);
    }
    /** Restart the timer with current settings (call after interval changes) */
    restartTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        const intervalMs = (0, settingsStore_1.getScanInterval)() * 1000;
        this.timer = setInterval(() => this.scan(), intervalMs);
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.knownSessions.clear();
    }
    /** Force an immediate re-scan (e.g. after settings change) */
    rescan() {
        this.scan();
    }
    scan() {
        const watchDirs = (0, settingsStore_1.getWatchDirs)();
        const threshold = (0, settingsStore_1.getActiveThreshold)();
        const cutoff = Date.now() - threshold * 60_000;
        const found = new Map();
        for (const dir of watchDirs) {
            const expandedPath = expandPath(dir.path);
            if (dir.type === 'claude-root') {
                this.scanClaudeRoot(expandedPath, cutoff, found);
            }
            else {
                this.scanProjectDir(expandedPath, cutoff, found);
            }
        }
        // Diff
        const added = [];
        const removed = [];
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
    scanClaudeRoot(rootPath, cutoff, found) {
        if (!fs.existsSync(rootPath))
            return;
        let entries;
        try {
            entries = fs.readdirSync(rootPath);
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const subdir = path.join(rootPath, entry);
            try {
                if (!fs.statSync(subdir).isDirectory())
                    continue;
            }
            catch {
                continue;
            }
            this.scanProjectDir(subdir, cutoff, found, entry);
        }
    }
    scanProjectDir(dirPath, cutoff, found, projectLabel) {
        if (!fs.existsSync(dirPath))
            return;
        let files;
        try {
            files = fs.readdirSync(dirPath);
        }
        catch {
            return;
        }
        const label = projectLabel || path.basename(dirPath);
        for (const file of files) {
            if (!file.endsWith('.jsonl'))
                continue;
            const fullPath = path.join(dirPath, file);
            try {
                const stat = fs.statSync(fullPath);
                if (stat.mtimeMs < cutoff)
                    continue;
                const id = `${label}/${file}`;
                found.set(id, {
                    id,
                    jsonlPath: fullPath,
                    mtime: stat.mtimeMs,
                    projectDir: label,
                });
            }
            catch {
                continue;
            }
        }
    }
}
exports.SessionWatcher = SessionWatcher;
/** Expand ~ to home directory, normalize path separators */
function expandPath(p) {
    if (p.startsWith('~')) {
        p = path.join(os.homedir(), p.slice(1));
    }
    return path.normalize(p);
}
//# sourceMappingURL=sessionWatcher.js.map