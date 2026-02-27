# electron-shell Specification

## Purpose

TBD - created by archiving change 'pixel-agents-standalone'. Update Purpose after archive.

## Requirements

### Requirement: Application window management
系統應建立一個載入 React renderer 應用程式的單一 BrowserWindow。視窗應可調整大小，最小尺寸為 800x600 像素。視窗應在重新啟動時還原其上次的位置與大小。

#### Scenario: App launch creates main window
- **WHEN** Electron app 啟動時
- **THEN** 建立一個 BrowserWindow，載入 renderer 的 index.html，並停用 nodeIntegration、啟用 contextIsolation

#### Scenario: Window size persistence
- **WHEN** 使用者調整視窗大小後關閉應用程式
- **THEN** 下次啟動時，視窗還原至相同的位置與尺寸

---
### Requirement: Application lifecycle management
系統應依照 Electron 最佳實踐處理 app ready、window-all-closed 及 activate 事件。Tray 在所有模式下都存在，關閉視窗不會退出應用。

#### Scenario: Graceful shutdown
- **WHEN** 使用者透過 tray "Exit" 選項退出
- **THEN** 所有已產生的 Claude CLI child process 應在應用程式結束前被終止

#### Scenario: App ready initialization
- **WHEN** Electron app 發出 'ready' 事件
- **THEN** 主視窗建立（除非 `-min` 模式）、tray icon 建立、IPC handler 註冊，並開始載入資源

---

### Requirement: 啟動參數解析
Electron main process SHALL 解析 `-min` 啟動參數，控制是否建立視窗。

#### Scenario: 正常啟動
- **WHEN** 無 `-min` 參數
- **THEN** 建立主視窗（現有行為），同時建立 tray icon

#### Scenario: -min 啟動
- **WHEN** 含 `-min` 參數
- **THEN** 不建立視窗，建立 tray icon，AgentController 正常初始化

---

### Requirement: 視窗關閉行為
window-all-closed 事件的處理 SHALL 根據是否有 tray 常駐來決定是否退出。Tray 在所有模式下都存在，因此關閉視窗永遠不會退出應用。

#### Scenario: 一般模式關閉視窗
- **WHEN** 非 `-min` 模式且所有視窗關閉
- **THEN** 應用程式不退出，tray icon 常駐，可透過 tray "Show Window" 恢復視窗

#### Scenario: -min 模式關閉視窗
- **WHEN** `-min` 模式且所有視窗關閉
- **THEN** 應用程式不退出，tray icon 常駐（無 Show Window 選項）

#### Scenario: 退出應用程式
- **WHEN** 使用者透過 tray "Exit" 選項
- **THEN** 應用程式完全退出

---
### Requirement: Preload script with contextBridge
系統應使用 preload script，透過 `contextBridge.exposeInMainWorld` 向 renderer 公開一個具型別的 `electronAPI` 物件。此 API 應支援雙向訊息傳遞。

#### Scenario: Renderer sends message to main
- **WHEN** renderer 呼叫 `window.electronAPI.send(channel, data)`
- **THEN** main process 透過 `ipcMain.on(channel, handler)` 接收訊息

#### Scenario: Main sends message to renderer
- **WHEN** main process 呼叫 `mainWindow.webContents.send(channel, data)`
- **THEN** renderer 透過已註冊的 `window.electronAPI.on(channel, callback)` 接收訊息

---
### Requirement: Project directory selection
系統應允許使用者在首次啟動時或透過選單選項選擇工作目錄。所選目錄應被持久化儲存，並用於推導 Claude projects 路徑（`~/.claude/projects/<encoded-path>`）。

#### Scenario: First launch without configured directory
- **WHEN** 應用程式啟動時尚未有持久化的專案目錄設定
- **THEN** 在 office view 載入前顯示目錄選擇對話框

#### Scenario: Directory change at runtime
- **WHEN** 使用者透過選單選取新的專案目錄
- **THEN** 現有的 agents 被清除，系統重新掃描新的專案路徑

---
### Requirement: Dev script process tree cleanup on Windows
`scripts/dev.mjs` 在 Windows 平台上 SHALL 使用 `taskkill /pid <pid> /T /F` 終止整個 process tree，確保 Vite 和 Electron 子進程在 dev script 結束時完全終止。

#### Scenario: Dev script cleanup on Windows
- **WHEN** dev script 在 Windows 上被中斷（Ctrl+C 或關閉終端）
- **THEN** 使用 `taskkill /T /F` 遞迴終止 Vite 和 Electron 的整個 process tree，不留下孤兒進程

#### Scenario: Dev script cleanup on non-Windows
- **WHEN** dev script 在 macOS/Linux 上被中斷
- **THEN** 使用標準 `.kill()` 或 process group signal 終止子進程
