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
系統應依照 Electron 最佳實踐處理 app ready、window-all-closed 及 activate 事件。在 Windows 上，關閉所有視窗應結束應用程式。

#### Scenario: Graceful shutdown
- **WHEN** 使用者關閉主視窗
- **THEN** 所有已產生的 Claude CLI child process 應在應用程式結束前被終止

#### Scenario: App ready initialization
- **WHEN** Electron app 發出 'ready' 事件
- **THEN** 主視窗建立、IPC handler 註冊，並開始載入資源

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
