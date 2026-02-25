## Why

Pixel Agents 目前是一個 VSCode extension，將 Claude Code agents 以像素風辦公室動畫呈現。但這限制了它只能在 VSCode 內使用，無法獨立運行或供非 VSCode 使用者體驗。將其抽離為獨立 Electron App 可以擴大使用場景，同時保留 80% 的現有程式碼。

## What Changes

- 建立全新的 Electron 應用程式殼層（main process + renderer process）
- 將 `/webview-ui` React + Canvas 遊戲引擎直接重用為 Electron renderer
- 將 `/src` Extension Host 層的核心邏輯（transcript 解析、file watching、agent 管理）移植到 Node.js main process
- 替換 `vscodeApi.ts`（2 行 shim）為 Electron IPC bridge
- 替換 VSCode CSS variables 為自定義 theme 系統
- 替換 `vscode.window.createTerminal()` 為 `child_process.spawn()` 啟動 Claude CLI
- 替換 `context.workspaceState` 為本地 JSON 檔案持久化
- 替換 VSCode FileSystemWatcher 為 `chokidar` 或 `fs.watch`
- 設定 electron-builder 打包為 Windows installer

## Capabilities

### New Capabilities
- `electron-shell`: Electron main process 應用程式殼層，包含視窗管理、應用程式生命週期、系統 tray
- `ipc-bridge`: Main/Renderer process 之間的雙向 IPC 通訊層，替代 VSCode webview postMessage
- `agent-backend`: Node.js 環境下的 agent 管理服務，包含 Claude CLI 啟動、JSONL transcript 監控、file watching
- `standalone-ui`: 從 VSCode webview 適配為獨立 Electron renderer 的 UI 層，包含 theme 系統和 asset 載入
- `app-packaging`: Electron 應用程式打包與分發設定

### Modified Capabilities

（無既有 specs 需要修改）

## Impact

- **原始碼來源**: `R:\pixel-agents-main` — 需從中提取並改寫程式碼
- **新增依賴**: electron, electron-builder, chokidar, electron-store
- **前端依賴**: 保留 React 19, Vite（調整為 Electron renderer build）
- **檔案系統**: 需讀取 `~/.claude/projects/` 下的 JSONL transcript 檔案
- **系統互動**: 需透過 `child_process.spawn` 啟動 Claude CLI process
- **目標平台**: Windows（初期），可擴展至 macOS/Linux
