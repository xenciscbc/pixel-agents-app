import { contextBridge, ipcRenderer } from 'electron';

type MessageCallback = (data: unknown) => void;

contextBridge.exposeInMainWorld('electronAPI', {
	send(channel: string, data: unknown): void {
		ipcRenderer.send(channel, data);
	},
	on(channel: string, callback: MessageCallback): void {
		ipcRenderer.on(channel, (_event, data) => callback(data));
	},
	removeListener(channel: string, callback: MessageCallback): void {
		ipcRenderer.removeListener(channel, callback);
	},
});
