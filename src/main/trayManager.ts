import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

export function createTray(
	getWindow: () => BrowserWindow | null,
	createWindowFn: () => void,
	minimizedMode: boolean,
): void {
	const iconPath = path.join(__dirname, '..', '..', 'resources', 'icon.png');
	const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

	tray = new Tray(icon);
	tray.setToolTip('Pixel Agents');

	const menuItems: Electron.MenuItemConstructorOptions[] = [];

	if (!minimizedMode) {
		menuItems.push({
			label: 'Show Window',
			click: () => {
				const win = getWindow();
				if (win) {
					win.show();
					win.focus();
				} else {
					createWindowFn();
				}
			},
		});
		menuItems.push({ type: 'separator' });
	}

	menuItems.push({
		label: 'Exit',
		click: () => {
			tray?.destroy();
			tray = null;
			app.quit();
		},
	});

	tray.setContextMenu(Menu.buildFromTemplate(menuItems));

	if (!minimizedMode) {
		tray.on('double-click', () => {
			const win = getWindow();
			if (win) {
				win.show();
				win.focus();
			} else {
				createWindowFn();
			}
		});
	}
}

export function getTray(): Tray | null {
	return tray;
}
