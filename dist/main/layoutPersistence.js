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
exports.readLayoutFromFile = readLayoutFromFile;
exports.writeLayoutToFile = writeLayoutToFile;
exports.loadLayout = loadLayout;
exports.watchLayoutFile = watchLayoutFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const constants_1 = require("./constants");
function getLayoutFilePath() {
    return path.join(os.homedir(), constants_1.LAYOUT_FILE_DIR, constants_1.LAYOUT_FILE_NAME);
}
function readLayoutFromFile() {
    const filePath = getLayoutFilePath();
    try {
        if (!fs.existsSync(filePath))
            return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch (err) {
        console.error('[Pixel Agents] Failed to read layout file:', err);
        return null;
    }
}
function writeLayoutToFile(layout) {
    const filePath = getLayoutFilePath();
    const dir = path.dirname(filePath);
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const json = JSON.stringify(layout, null, 2);
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, json, 'utf-8');
        fs.renameSync(tmpPath, filePath);
    }
    catch (err) {
        console.error('[Pixel Agents] Failed to write layout file:', err);
    }
}
function loadLayout(defaultLayout) {
    const fromFile = readLayoutFromFile();
    if (fromFile) {
        console.log('[Pixel Agents] Layout loaded from file');
        return fromFile;
    }
    if (defaultLayout) {
        console.log('[Pixel Agents] Writing bundled default layout to file');
        writeLayoutToFile(defaultLayout);
        return defaultLayout;
    }
    return null;
}
function watchLayoutFile(onExternalChange) {
    const filePath = getLayoutFilePath();
    let skipNextChange = false;
    let lastMtime = 0;
    let fsWatcher = null;
    let pollTimer = null;
    let disposed = false;
    try {
        if (fs.existsSync(filePath)) {
            lastMtime = fs.statSync(filePath).mtimeMs;
        }
    }
    catch { /* ignore */ }
    function checkForChange() {
        if (disposed)
            return;
        try {
            if (!fs.existsSync(filePath))
                return;
            const stat = fs.statSync(filePath);
            if (stat.mtimeMs <= lastMtime)
                return;
            lastMtime = stat.mtimeMs;
            if (skipNextChange) {
                skipNextChange = false;
                return;
            }
            const raw = fs.readFileSync(filePath, 'utf-8');
            const layout = JSON.parse(raw);
            console.log('[Pixel Agents] External layout change detected');
            onExternalChange(layout);
        }
        catch (err) {
            console.error('[Pixel Agents] Error checking layout file:', err);
        }
    }
    function startFsWatch() {
        if (disposed || fsWatcher)
            return;
        try {
            if (!fs.existsSync(filePath))
                return;
            fsWatcher = fs.watch(filePath, () => {
                checkForChange();
            });
            fsWatcher.on('error', () => {
                fsWatcher?.close();
                fsWatcher = null;
            });
        }
        catch {
            // File may not exist yet
        }
    }
    startFsWatch();
    pollTimer = setInterval(() => {
        if (disposed)
            return;
        if (!fsWatcher) {
            startFsWatch();
        }
        checkForChange();
    }, constants_1.LAYOUT_FILE_POLL_INTERVAL_MS);
    return {
        markOwnWrite() {
            skipNextChange = true;
            try {
                if (fs.existsSync(filePath)) {
                    lastMtime = fs.statSync(filePath).mtimeMs;
                }
            }
            catch { /* ignore */ }
        },
        dispose() {
            disposed = true;
            fsWatcher?.close();
            fsWatcher = null;
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        },
    };
}
//# sourceMappingURL=layoutPersistence.js.map