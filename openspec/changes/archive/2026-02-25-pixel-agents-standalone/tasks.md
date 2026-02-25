## 1. 專案腳手架

- [x] 1.1 初始化 Electron 專案：package.json、TypeScript 設定、Vite 設定（main/renderer/preload）
- [x] 1.2 建立 Electron main process 進入點（`src/main/index.ts`）：BrowserWindow 建立、app 生命週期事件、視窗狀態持久化
- [x] 1.3 建立 preload script（`src/preload/index.ts`）：contextBridge 暴露 `electronAPI`（send、on、removeListener）
- [x] 1.4 複製 `webview-ui/` 到 `src/renderer/`，調整 Vite build 設定輸出 Electron renderer bundle

## 2. IPC 橋接層

- [x] 2.1 用 Electron IPC shim 替換 `vscodeApi.ts`，匯出 `{ postMessage(msg) }` 使用 `window.electronAPI.send('message', msg)`
- [x] 2.2 更新 `useExtensionMessages.ts`，改用 `window.electronAPI.on('message', callback)` 取代 `window.addEventListener('message', handler)`
- [x] 2.3 在 main process 註冊 `ipcMain.on('message', handler)` 將 renderer 訊息路由到對應的處理函式

## 3. Agent 後端服務

- [x] 3.1 移植 `transcriptParser.ts` 到 main process（純邏輯，無 VSCode 依賴 — 直接複製）
- [x] 3.2 移植 `fileWatcher.ts` — 用 `fs.watch` + polling fallback 替代 VSCode FileSystemWatcher，保留 `startFileWatching`、`readNewLines`、`ensureProjectScan` 函式
- [x] 3.3 移植 `timerManager.ts`（純邏輯 — 直接複製）
- [x] 3.4 移植 `types.ts` — 移除 `terminalRef: vscode.Terminal` 改為 `processRef: ChildProcess`，加入 `MessageSender` 介面
- [x] 3.5 移植 `agentManager.ts` — 用 `child_process.spawn('claude', ['--session-id', uuid])` 替代 `vscode.window.createTerminal()`，用 process kill 替代 terminal.dispose，用 JSON 檔案持久化替代 `context.workspaceState`
- [x] 3.6 移植 `constants.ts`（直接複製，移除 VSCode 特定常數）
- [x] 3.7 實作專案目錄選擇 — 首次啟動時彈出對話框、選單選項可更換、持久化到 app 設定 JSON

## 4. Main Process 控制器

- [x] 4.1 建立 `AgentController` 類別（替代 `PixelAgentsViewProvider`），管理 agent 生命週期、file watchers、timers，透過 `webContents.send()` 發送訊息到 renderer
- [x] 4.2 實作 `webviewReady` handler — 觸發 agent 恢復、asset 載入、layout 發送
- [x] 4.3 實作 `openClaude` handler — 產生 Claude CLI process、建立 agent、啟動 JSONL 監控
- [x] 4.4 實作 `focusAgent` / `closeAgent` handlers — 對應到 child process 管理（closeAgent 終止 process）
- [x] 4.5 實作 `saveAgentSeats`、`saveLayout`、`setSoundEnabled` handlers — 寫入 userData 目錄的 JSON 檔案
- [x] 4.6 實作 `exportLayout` / `importLayout` handlers — 使用 `dialog.showSaveDialog` / `dialog.showOpenDialog`

## 5. Asset 載入

- [x] 5.1 移植 `assetLoader.ts` — 移除 `asWebviewUri()` 呼叫，從打包的 assets 目錄載入（使用 `process.resourcesPath`）
- [x] 5.2 複製 assets 目錄（PNG sprites、default-layout.json）到專案的 `resources/assets/`
- [x] 5.3 移植 `layoutPersistence.ts` — 用直接 JSON 檔案讀寫替代 `context.workspaceState`，保留 `.pixel-agents/layout.json` 格式

## 6. UI 適配

- [x] 6.1 建立 CSS root theme，在 `:root` 定義 `--vscode-*` 變數的對應值（前景、背景、editor 顏色、圖表顏色）
- [x] 6.2 所有 renderer 原始碼中的 `--vscode-` CSS 變數引用無需修改 — `:root` 已提供定義值
- [x] 6.3 驗證所有 React components 在新 theme 下正確渲染（AgentLabels、BottomToolbar、SettingsModal、DebugView、ZoomControls、EditorToolbar）

## 7. 打包與分發

- [x] 7.1 在 package.json 設定 electron-builder，Windows NSIS 目標、app icon、resource 打包
- [x] 7.2 建立 `npm run dev` script，支援 hot-reload 開發（Vite dev server + Electron）
- [x] 7.3 建立 `npm run build` 和 `npm run package` scripts，用於生產環境 build 和 installer 產生
- [x] 7.4 在乾淨 Windows 環境測試打包後的 app — 驗證 sprites 載入、agents 產生、JSONL 監控正常運作
