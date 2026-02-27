## Context

agent-viewer 是 Electron 應用，入口在 `src/main/index.ts`，使用 `BrowserWindow` 建立主視窗。設定透過 `settingsStore.ts` 持久化至 JSON，IPC 透過 `agentController.ts` 處理 renderer 與 main 之間的通訊。目前沒有 system tray 功能，也沒有 argv 參數解析。

## Goals / Non-Goals

**Goals:**
- 視窗置頂（always-on-top）可在 Settings 中切換
- System tray icon，右鍵 Exit
- `-min` 啟動參數讓應用最小化到 tray
- `peerName`、`broadcastEnabled`、`udpPort` 設定為後續區網共享準備

**Non-Goals:**
- 不實作 UDP 廣播功能（屬於 `lan-peer-sharing` change）
- 不實作 tray icon 顯示 agent 數量等動態資訊

## Decisions

### 1. Always-on-top

**選擇**: 透過 `BrowserWindow.setAlwaysOnTop(bool)` 控制。設定存入 `settingsStore`，啟動時讀取並套用。

**實作**: agentController 新增 `setAlwaysOnTop` IPC handler，呼叫 `win.setAlwaysOnTop()`。`handleWebviewReady` 發送初始值 `alwaysOnTopLoaded`。

### 2. System Tray

**選擇**: 新建 `src/main/trayManager.ts` 模組，封裝 Electron `Tray` 和 `Menu`。

**實作**:
- `createTray()` 建立 tray icon（使用應用 icon）
- 右鍵 context menu：`Show Window` / `Exit`
- `Show Window` → `win.show()` + `win.focus()`
- `Exit` → `app.quit()`
- tray icon 在 app ready 後建立

**理由**: 獨立模組避免 index.ts 變得太大，且 tray 生命週期需要獨立管理。

### 3. `-min` 啟動參數

**選擇**: 在 `index.ts` 的 `app.whenReady()` 中解析 `process.argv`，若含 `-min` 則不呼叫 `createWindow()`，只建立 tray。

**實作**:
```
const startMinimized = process.argv.includes('-min');

app.whenReady().then(() => {
  controller = new AgentController(...);
  createTray(...);

  if (!startMinimized) {
    createWindow();
  }
});
```

視窗關閉行為也要調整：`-min` 模式下 `window-all-closed` 不 quit（因為 tray 還在）。使用者透過 tray Exit 才真正退出。

**理由**: 最小改動，不影響正常啟動流程。

### 4. Peer Identity 設定

**選擇**: 在 `settingsStore.ts` 新增三個設定：
- `peerName: string`（預設 `os.hostname()`）
- `broadcastEnabled: boolean`（預設 `true`）
- `udpPort: number`（預設 `47800`）

**理由**: 這些設定在此 change 中只做 UI 和持久化，實際使用在 `lan-peer-sharing` change。先建立是因為 Settings UI 自然放在一起。

### 5. Settings UI 佈局

**選擇**: SettingsModal 新增兩個 section：
1. **Window** section — Always-on-top toggle
2. **Network** section — Peer Name input、Broadcast toggle、UDP Port input

**理由**: 功能分組清晰，與現有的 Sound、Font Scale section 並列。

## Risks / Trade-offs

- **[Tray icon 跨平台]** Windows/macOS/Linux 的 tray 行為略有不同（macOS 需要 template image）→ 先以 Windows 為主，icon 用 PNG。
- **[`-min` 無視窗]** `-min` 模式下 AgentController 的 `getWindow()` 回傳 null，需確保不會 crash → controller 已有 null check。
- **[UDP port 衝突]** 使用者可能設定已被佔用的 port → 實際驗證在 `lan-peer-sharing` change 中處理。
