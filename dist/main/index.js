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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const agentController_1 = require("./agentController");
const settingsStore_1 = require("./settingsStore");
let mainWindow = null;
let controller = null;
function loadWindowState() {
    try {
        const state = (0, settingsStore_1.getSetting)('windowState', null);
        if (state)
            return state;
    }
    catch { /* use defaults */ }
    return { width: 1200, height: 800 };
}
function saveWindowState(win) {
    (0, settingsStore_1.setSetting)('windowState', win.getBounds());
}
function createWindow() {
    const state = loadWindowState();
    mainWindow = new electron_1.BrowserWindow({
        width: state.width,
        height: state.height,
        x: state.x,
        y: state.y,
        minWidth: 800,
        minHeight: 600,
        title: 'Pixel Agents',
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    if (!electron_1.app.isPackaged) {
        const portArg = process.argv.find(a => a.startsWith('--dev-port='));
        const devPort = portArg ? portArg.split('=')[1] : '5173';
        mainWindow.loadURL(`http://localhost:${devPort}`);
    }
    else {
        const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
        mainWindow.loadFile(rendererPath);
    }
    mainWindow.on('close', () => {
        if (mainWindow)
            saveWindowState(mainWindow);
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    controller = new agentController_1.AgentController(() => mainWindow);
    // Register IPC handler
    electron_1.ipcMain.on('message', (_event, msg) => {
        controller?.handleMessage(msg);
    });
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    controller?.dispose();
    electron_1.app.quit();
});
//# sourceMappingURL=index.js.map