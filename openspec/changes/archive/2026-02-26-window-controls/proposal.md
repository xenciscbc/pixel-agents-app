## Why

使用者需要在多螢幕或多工環境中持續監控 agent 狀態，視窗置頂可避免被其他視窗遮擋。同時，為了支援後續區網共享功能（`lan-peer-sharing`），需要先建立 peer 名稱設定和廣播開關。常駐模式（tray + `-min`）讓應用程式可以在背景持續運作，只廣播狀態而不佔用螢幕。

## What Changes

- 新增 Always-on-top 視窗置頂 toggle（Settings）
- 新增 System Tray icon，右鍵選單含 Exit
- 支援 `-min` 啟動參數，啟動後最小化到 system tray 不顯示視窗
- 新增 `peerName` 設定（預設為電腦 hostname），供區網共享識別身份
- 新增 `broadcastEnabled` 設定（預設 true），控制是否對外廣播 agent 狀態
- 新增 `udpPort` 設定（預設 47800），供區網廣播使用

## Capabilities

### New Capabilities
- `window-controls`: 視窗置頂、system tray、`-min` 常駐模式
- `peer-identity`: peer 名稱設定、廣播開關、UDP port 設定

### Modified Capabilities
- `settings-ui`: SettingsModal 新增 Always-on-top toggle、Peer Name input、Broadcast toggle、UDP Port input
- `electron-shell`: index.ts 新增 `-min` argv 解析、條件建立視窗、tray 管理

## Impact

- `src/main/index.ts` — argv 解析、tray 建立、always-on-top、條件建視窗
- `src/main/trayManager.ts` — 新模組，system tray icon + context menu
- `src/main/settingsStore.ts` — 新增 4 個設定鍵值
- `src/main/agentController.ts` — 新增 IPC handlers
- `src/renderer/src/hooks/useExtensionMessages.ts` — 新增 state
- `src/renderer/src/components/SettingsModal.tsx` — 新增 4 個控件
- `src/renderer/src/components/BottomToolbar.tsx` — 透傳新 props
- `src/renderer/src/App.tsx` — 透傳新 props
