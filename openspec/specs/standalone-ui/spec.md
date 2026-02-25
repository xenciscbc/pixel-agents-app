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
系統應保留 agent 等待狀態的通知音效系統。音效啟用／停用偏好設定應持久化儲存於應用程式設定中。

#### Scenario: Sound on waiting
- **WHEN** agent 進入等待狀態
- **THEN** 若設定中音效已啟用，則播放通知音效

---
### Requirement: Import/Export layout via native dialogs
系統應使用 Electron 的 `dialog.showSaveDialog` 及 `dialog.showOpenDialog` 進行 layout 匯入／匯出，以取代 VSCode 的 dialog API。

#### Scenario: Export layout
- **WHEN** 使用者觸發 layout 匯出
- **THEN** 開啟原生儲存對話框，預設檔名為 `pixel-agents-layout.json`

#### Scenario: Import layout
- **WHEN** 使用者觸發 layout 匯入並選取有效的 JSON 文件
- **THEN** layout 被載入並傳送至 renderer
