import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AgentController } from './agentController';
import { getSetting, setSetting } from './settingsStore';

let mainWindow: BrowserWindow | null = null;
let controller: AgentController | null = null;

function loadWindowState(): { x?: number; y?: number; width: number; height: number } {
	try {
		const state = getSetting<{ x?: number; y?: number; width: number; height: number } | null>('windowState', null);
		if (state) return state;
	} catch { /* use defaults */ }
	return { width: 1200, height: 800 };
}

function saveWindowState(win: BrowserWindow): void {
	setSetting('windowState', win.getBounds());
}

function createWindow(): void {
	const state = loadWindowState();

	mainWindow = new BrowserWindow({
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

	if (!app.isPackaged) {
		const portArg = process.argv.find(a => a.startsWith('--dev-port='));
		const devPort = portArg ? portArg.split('=')[1] : '5173';
		mainWindow.loadURL(`http://localhost:${devPort}`);
	} else {
		const rendererPath = path.join(__dirname, '..', 'renderer', 'index.html');
		mainWindow.loadFile(rendererPath);
	}

	mainWindow.on('close', () => {
		if (mainWindow) saveWindowState(mainWindow);
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	controller = new AgentController(() => mainWindow);

	// Register IPC handler
	ipcMain.on('message', (_event, msg: { type: string; [key: string]: unknown }) => {
		controller?.handleMessage(msg);
	});

	createWindow();
});

app.on('window-all-closed', () => {
	controller?.dispose();
	app.quit();
});
