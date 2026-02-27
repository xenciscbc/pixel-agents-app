## 1. Settings 持久化

- [x] 1.1 settingsStore.ts 新增 `alwaysOnTop` 設定：`getAlwaysOnTop(): boolean`（預設 false）、`setAlwaysOnTop(v: boolean)`
- [x] 1.2 settingsStore.ts 新增 `peerName` 設定：`getPeerName(): string`（預設 `os.hostname()`）、`setPeerName(name: string)`
- [x] 1.3 settingsStore.ts 新增 `broadcastEnabled` 設定：`getBroadcastEnabled(): boolean`（預設 true）、`setBroadcastEnabled(v: boolean)`
- [x] 1.4 settingsStore.ts 新增 `udpPort` 設定：`getUdpPort(): number`（預設 47800）、`setUdpPort(port: number)`

## 2. IPC Handlers

- [x] 2.1 agentController.ts 新增 `setAlwaysOnTop` handler：呼叫 `setAlwaysOnTop()` 存入 disk，呼叫 `win.setAlwaysOnTop()`，回傳 `alwaysOnTopLoaded`
- [x] 2.2 agentController.ts 新增 `setPeerName` handler：存入 disk，回傳 `peerNameLoaded`
- [x] 2.3 agentController.ts 新增 `setBroadcastEnabled` handler：存入 disk，回傳 `broadcastEnabledLoaded`
- [x] 2.4 agentController.ts 新增 `setUdpPort` handler：存入 disk，回傳 `udpPortLoaded`
- [x] 2.5 agentController.ts `handleWebviewReady` 發送 `alwaysOnTopLoaded`、`peerNameLoaded`、`broadcastEnabledLoaded`、`udpPortLoaded` 初始值

## 3. Renderer State

- [x] 3.1 useExtensionMessages.ts 新增 `alwaysOnTop`、`peerName`、`broadcastEnabled`、`udpPort` state
- [x] 3.2 useExtensionMessages.ts 新增 `alwaysOnTopLoaded`、`peerNameLoaded`、`broadcastEnabledLoaded`、`udpPortLoaded` message handlers

## 4. Settings UI

- [x] 4.1 SettingsModal.tsx 新增 props：`alwaysOnTop`、`onAlwaysOnTopChange`、`peerName`、`onPeerNameChange`、`broadcastEnabled`、`onBroadcastEnabledChange`、`udpPort`、`onUdpPortChange`
- [x] 4.2 SettingsModal.tsx 新增 Window section：Always on Top toggle
- [x] 4.3 SettingsModal.tsx 新增 Network section：Peer Name text input、Broadcast toggle、UDP Port number input
- [x] 4.4 BottomToolbar.tsx 透傳新的 props 給 SettingsModal
- [x] 4.5 App.tsx 從 hook 取得新 state，建立 callback handlers，傳遞給 BottomToolbar

## 5. System Tray

- [x] 5.1 新建 `src/main/trayManager.ts`：`createTray(getWindow, createWindowFn, appIconPath)` 函數，建立 Tray + context menu（Show Window / Exit）
- [x] 5.2 index.ts import trayManager，在 `app.whenReady` 中呼叫 `createTray()`

## 6. `-min` 啟動參數

- [x] 6.1 index.ts 解析 `process.argv.includes('-min')`，存為 `startMinimized`
- [x] 6.2 index.ts 條件建立視窗：`if (!startMinimized) createWindow()`
- [x] 6.3 index.ts 調整 `window-all-closed` handler：有 tray 時不 quit

## 7. Always-on-top 啟動時套用

- [x] 7.1 index.ts `createWindow()` 後讀取 `getAlwaysOnTop()` 並呼叫 `win.setAlwaysOnTop()`

## 8. 驗證

- [x] 8.1 Type check 通過（main、preload、renderer）
