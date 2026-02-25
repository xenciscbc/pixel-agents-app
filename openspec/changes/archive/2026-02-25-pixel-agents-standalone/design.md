## Context

Pixel Agents 是一個 VSCode extension，透過解析 Claude Code 的 JSONL transcript 檔案來追蹤 agent 狀態，並以像素風辦公室動畫呈現。原始碼位於 `R:\pixel-agents-main`，分為兩層：

- **Extension Host (`/src`, 10 files)**: 深度依賴 VSCode API（Terminal、FileSystemWatcher、workspaceState、Webview）
- **Webview UI (`/webview-ui`, ~35 files)**: React 19 + Canvas 2D 遊戲引擎，僅透過 `vscodeApi.ts`（2 行 shim）與 extension 通訊

目標是將其抽離為獨立 Electron App，最大化程式碼重用。

## Goals / Non-Goals

**Goals:**
- 建立可獨立運行的 Electron App，不依賴 VSCode
- 重用 Webview UI 層 80%+ 的程式碼（遊戲引擎、React components、動畫系統）
- 移植 Extension Host 層的核心邏輯至 Node.js main process
- 支援 Windows 平台打包分發

**Non-Goals:**
- 不需維持與 VSCode extension 的相容性（不做 universal build）
- 不需支援 macOS/Linux（初期）
- 不需新增原版沒有的功能
- 不需實作 auto-update 機制

## Decisions

### D1: 使用 Electron + Vite 作為應用框架

**選擇**: Electron + electron-vite（或 Vite 手動配置）

**替代方案**:
- **Tauri**: 更輕量，但需 Rust 工具鏈，且對 `child_process.spawn` 和直接檔案系統存取的支援不如 Electron 原生
- **純 Web App + Backend**: 需要額外建 HTTP server 來存取 JSONL 檔案，架構更複雜

**理由**: Electron 提供完整的 Node.js main process，可以直接使用 `fs`、`child_process`、`path` 等模組，與原始 Extension Host 程式碼的移植路徑最短。Webview UI 已是 React + Vite，幾乎零成本轉為 Electron renderer。

### D2: IPC 通訊架構 — contextBridge + ipcRenderer

**選擇**: 使用 Electron 的 `contextBridge` 暴露型別安全的 API 給 renderer process

**理由**:
- 替換 `vscodeApi.ts` 的 `acquireVsCodeApi().postMessage()` 為 `window.electronAPI.send()`
- Renderer 端改動最小 — 只需替換 import source
- Main process 用 `ipcMain.on/handle` 接收，與原始 `onDidReceiveMessage` handler 結構一致

**訊息協定**: 完全沿用原始 message types（`agentCreated`、`agentClosed`、`agentToolStart` 等），無需改動 webview 邏輯

### D3: Agent 生命週期管理 — child_process.spawn 替代 Terminal

**選擇**: 用 `child_process.spawn('claude', ['--session-id', uuid])` 啟動 Claude CLI

**關鍵差異**:
| VSCode Extension | Electron App |
|---|---|
| `vscode.window.createTerminal()` | `child_process.spawn()` |
| `terminal.show()` / `terminal.sendText()` | stdin/stdout pipe |
| `onDidCloseTerminal` | `process.on('exit')` |
| `vscode.window.terminals` (restore) | 自行追蹤 child processes |

**注意**: 獨立版不提供 interactive terminal UI，agent 只在背景執行。若未來需要 terminal 互動，可考慮 xterm.js。

### D4: 狀態持久化 — JSON 檔案

**選擇**: 直接使用 JSON 檔案儲存在 app 的 userData 目錄

**替代方案**: electron-store（封裝了 JSON 持久化 + schema validation）

**理由**: 原始碼已有 `layoutPersistence.ts` 使用 JSON 檔案，保持一致。需替換的只有 `context.workspaceState` 的 get/set 呼叫。

### D5: Asset 載入 — 靜態檔案直接存取

**選擇**: 將 assets 目錄打包進 app resources，用 `path.join(app.getAppPath(), 'assets')` 直接讀取

**理由**: 原始 extension 已在 main process 用 `fs.readFileSync` 載入 PNG 並轉為 sprite data，Electron 中完全相同，無需 `asWebviewUri()` 轉換。

### D6: 工作目錄偵測

**選擇**: 啟動時掃描 `~/.claude/projects/` 或讓使用者選擇專案目錄

**理由**: VSCode extension 靠 `vscode.workspace.workspaceFolders` 取得當前專案路徑，獨立 app 需自行實作。可用 Electron 的 dialog 或命令列參數。

## Risks / Trade-offs

- **[無 Terminal UI]** → 初期不提供 interactive terminal，agent 僅背景執行。若使用者需要互動，需後續加入 xterm.js。
- **[單專案限制]** → 初期可能只支援單一專案目錄，多專案支援需額外 UI。
- **[Electron 體積]** → 打包後 ~150MB+，遠大於 VSCode extension。→ 可接受，因為是桌面應用。
- **[原始碼同步]** → 與上游 pixel-agents repo 可能脫鉤。→ 接受，視為 fork。
- **[Windows Only]** → 初期只打包 Windows。→ Electron 本身跨平台，後續擴展成本低。
