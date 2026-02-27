# standalone-ui Specification

## Purpose

TBD - created by archiving change 'pixel-agents-standalone'. Update Purpose after archive.

## Requirements

### Requirement: CSS theme system replacing VSCode variables
系統應定義 CSS custom properties，取代 webview 中所有使用的 `--vscode-*` CSS 變數。預設應使用深色主題，顏色與 VSCode 深色主題相符。

#### Scenario: Dark theme applied
- **WHEN** 應用程式載入
- **THEN** 所有 UI 元素以符合原始 VSCode 深色主題外觀的顏色渲染（深色背景、淺色文字）

#### Scenario: CSS variable mapping
- **WHEN** 程式碼參照 `--vscode-foreground` 或 `--vscode-editor-background`
- **THEN** 改用對應的 custom properties（`--app-foreground`、`--app-editor-background`），數值相符

---
### Requirement: Asset loading via static files
系統應使用 main process 中的 `fs.readFileSync` 從應用程式的打包資源目錄載入 sprite 資源（角色、地板磚、牆壁磚、家具），並透過 IPC 傳送至 renderer，方式與原始 extension 相同。

#### Scenario: Asset loading on startup
- **WHEN** renderer 傳送 `webviewReady`
- **THEN** main process 從打包的 `assets/` 目錄載入所有 PNG 格式的 sprite 資源，並傳送 `characterSpritesLoaded`、`floorTilesLoaded`、`wallTilesLoaded` 及 `furnitureAssetsLoaded` 訊息

---
### Requirement: Layout persistence via file system
系統應使用專案目錄中相同的 `.pixel-agents/layout.json` 文件格式來儲存與載入 office layout。跨實例同步應使用 `fs.watch` 監控 layout 文件。

#### Scenario: Layout save
- **WHEN** renderer 傳送 `saveLayout` 訊息
- **THEN** layout 被寫入專案目錄中的 `.pixel-agents/layout.json`

#### Scenario: External layout change
- **WHEN** layout 文件被外部修改
- **THEN** 新的 layout 透過 `layoutLoaded` 訊息傳送至 renderer

---
### Requirement: Sound notification
系統應根據 Sound Settings 中的細項設定，在對應狀態事件發生時播放通知音效。僅限本機 agent 事件觸發。

#### Scenario: Waiting 音效
- **WHEN** 本機 agent 進入 waiting 狀態且 soundSettings.enabled 為 true 且 soundSettings.waiting 為 true
- **THEN** 播放通知音效

#### Scenario: Rest 音效
- **WHEN** 本機 agent 進入 rate_limited 狀態且 soundSettings.enabled 為 true 且 soundSettings.rest 為 true
- **THEN** 播放通知音效

#### Scenario: Needs Approval 音效
- **WHEN** 本機 agent 收到 agentToolPermission 且 soundSettings.enabled 為 true 且 soundSettings.needsApproval 為 true
- **THEN** 播放通知音效

#### Scenario: Idle 音效
- **WHEN** 本機 agent 變為 idle（agentToolsClear 且無 active tool）且 soundSettings.enabled 為 true 且 soundSettings.idle 為 true
- **THEN** 播放通知音效

#### Scenario: 總開關關閉
- **WHEN** soundSettings.enabled 為 false
- **THEN** 不播放任何音效，無論各事件 checkbox 狀態

---
### Requirement: Import/Export layout via native dialogs
系統應使用 Electron 的 `dialog.showSaveDialog` 及 `dialog.showOpenDialog` 進行 layout 匯入／匯出，以取代 VSCode 的 dialog API。

#### Scenario: Export layout
- **WHEN** 使用者觸發 layout 匯出
- **THEN** 開啟原生儲存對話框，預設檔名為 `pixel-agents-layout.json`

#### Scenario: Import layout
- **WHEN** 使用者觸發 layout 匯入並選取有效的 JSON 文件
- **THEN** layout 被載入並傳送至 renderer

---

### Requirement: AgentListPanel 狀態顯示 rate_limited
AgentListPanel SHALL 支援 rate_limited 狀態，顯示為紅色 "Rest"。

#### Scenario: rate_limited agent 在 list 中
- **WHEN** agent 狀態為 rate_limited
- **THEN** 顯示紅色 dot + "Rest" 文字

---

### Requirement: 移除 AgentListPanel 粗體字
AgentListPanel SHALL 不使用 `fontWeight: 'bold'`。

#### Scenario: Project header 不使用粗體
- **WHEN** AgentListPanel 渲染 project header
- **THEN** 不套用 fontWeight: 'bold'

---

### Requirement: AgentListPanel 字體縮放
AgentListPanel SHALL 根據 `fontScale` 設定縮放所有 fontSize。

#### Scenario: fontScale 套用
- **WHEN** fontScale 變更
- **THEN** 標題、project header、agent label、status、sub-agent 的 fontSize 等比例縮放

---

### Requirement: AgentLabels 字體縮放
AgentLabels tooltip SHALL 根據 `fontScale` 設定縮放 fontSize。

#### Scenario: fontScale 套用至 tooltip
- **WHEN** fontScale 變更
- **THEN** tooltip 中的 agent label 和 status text fontSize 等比例縮放

---

### Requirement: Renderer 新增 remotePeers state
useExtensionMessages hook SHALL 新增 `remotePeers` state 管理遠端 peer 資料。

#### Scenario: 初始狀態
- **WHEN** app 啟動
- **THEN** remotePeers 為空陣列

#### Scenario: 接收 remotePeersUpdated
- **WHEN** 收到 `remotePeersUpdated` IPC 訊息
- **THEN** 以 peers snapshot 替換整個 remotePeers 陣列

#### Scenario: Peer 移除
- **WHEN** 收到不含某 peerId 的 snapshot
- **THEN** 該 peer 從 remotePeers 中消失，UI 即時更新

---

### Requirement: statusHistory state
useExtensionMessages hook SHALL 新增 `statusHistory: Record<number, string[]>` state，追蹤每個 agent 的狀態歷史。

#### Scenario: 初始狀態
- **WHEN** app 啟動
- **THEN** statusHistory 為空 object `{}`

#### Scenario: 歷史更新
- **WHEN** 狀態事件觸發
- **THEN** 對應 agent 的歷史 array 更新（最新在 index 0，連續去重，上限 10 筆）

#### Scenario: hook 回傳
- **WHEN** 消費者存取 useExtensionMessages 回傳值
- **THEN** 可取得 `statusHistory` 欄位
