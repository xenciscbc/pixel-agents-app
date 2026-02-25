## Why

目前 app 需要使用者手動選擇單一專案目錄，並透過 spawn Claude CLI 來建立 agent。這限制了使用彈性 — 無法同時觀察多個專案的 Claude Code sessions，也無法自動發現正在運行的 sessions。此外 dev script 使用 `NODE_ENV` 環境變數和 `concurrently`，在 Windows 上有跨 shell 相容性問題。

## What Changes

- 新增「監控模式」— 自動掃描指定目錄下的 JSONL 轉錄文件，發現活躍的 Claude Code sessions 並以純觀察方式顯示為 agents
- 支援多種目錄設定方式：批次掃描 `~/.claude/projects` 全部子目錄、或指定單一專案目錄
- 以活躍閾值（預設 30 分鐘）過濾，只顯示近期有活動的 sessions
- 在 Settings Modal 新增目錄管理 UI（新增/移除監控目錄、設定閾值）
- 所有設定持久化到 settings.json，下次啟動自動載入
- **BREAKING**: 移除首次啟動的專案目錄選擇對話框，改為空辦公室 + Settings 引導
- 重構 dev script — 用 `scripts/dev.mjs` 取代 `concurrently`，從 settings 讀取 dev port，跨平台相容

## Capabilities

### New Capabilities
- `session-watcher`: 多目錄 JSONL 掃描、活躍 session 自動發現、純觀察模式 agent 管理
- `settings-ui`: Settings Modal 擴充 — 目錄管理、閾值設定、dev port 設定，設定持久化
- `dev-script`: 跨平台 dev 啟動腳本，支援可設定的 port

### Modified Capabilities
（無現有 spec 需修改）

## Impact

- `src/main/agentController.ts` — 新增監控模式邏輯，與現有 spawn 模式並存或替代
- `src/main/index.ts` — 移除首次 dialog，改為直接啟動
- `src/main/settingsStore.ts` — 新增 watchDirs、activeThresholdMinutes、devPort 設定項
- `src/renderer/` — Settings Modal 元件擴充
- `package.json` — dev script 改為 `node scripts/dev.mjs`，移除 `concurrently` 依賴
- 新增 `scripts/dev.mjs`
