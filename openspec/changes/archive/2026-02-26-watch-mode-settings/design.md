## Context

Pixel Agents standalone app 目前透過 spawn Claude CLI 建立 agent，需要使用者手動選擇專案目錄。dev script 使用 `concurrently` 和 Unix-only 環境變數語法，在 Windows cmd/PowerShell 不相容。

現有元件：
- `agentController.ts` — agent 生命週期管理（spawn/kill process）
- `settingsStore.ts` — JSON 持久化（`userData/settings.json`）
- `fileWatcher.ts` — JSONL tail/polling
- `transcriptParser.ts` — JSONL → agent 狀態解析
- `SettingsModal.tsx` — 簡單的選單式設定 UI

## Goals / Non-Goals

**Goals:**
- 自動掃描 `~/.claude/projects` 及指定目錄，發現活躍 Claude Code sessions
- 純觀察模式 — 只讀取 JSONL，不 spawn/kill process
- Settings UI 管理監控目錄、閾值、dev port
- 設定持久化，下次啟動自動載入
- 跨平台 dev script（Windows + macOS）

**Non-Goals:**
- 不實作 agent 控制功能（開/關 Claude CLI）— 這是原有功能，不移除但不擴展
- 不實作即時 theme 切換
- 不實作多辦公室 / 專案分組顯示

## Decisions

### D1: 監控目錄的兩種類型

使用者可設定兩種 watchDir：
- **Claude Root** (`~/.claude/projects`) — 掃描所有子目錄，每個子目錄 = 一個專案
- **Single Project** (如 `D:/work/foo/.claude`) — 直接監控該目錄下的 JSONL

在 settings.json 中以 type 欄位區分：
```json
{
  "watchDirs": [
    { "type": "claude-root", "path": "~/.claude/projects" },
    { "type": "project", "path": "D:/work/foo/.claude" }
  ]
}
```

**為何不用純路徑**: 需要知道是要「掃子目錄」還是「直接監控」，語義不同。

### D2: 活躍 session 判定

- 定期掃描（每 30 秒）所有 watchDir 下的 `*.jsonl` 檔案
- 檢查 `mtime`，若 `now - mtime < activeThresholdMinutes` 則視為活躍
- 新發現的活躍 session → 建立觀察 agent，開始 tail JSONL
- 已超過閾值的 session → 標記 idle 並在下次掃描時移除 agent

### D3: 觀察 agent vs 可控 agent

新增 `AgentMode` 概念：
- `observe` — 只讀取 JSONL，無 process ref，不可 close
- `managed` — 原有行為，有 process ref，可 spawn/close

AgentState 加入 `mode: 'observe' | 'managed'` 欄位。UI 端根據 mode 隱藏 close button。

### D4: Agent label 使用自動編號

觀察模式的 agent 以 `Agent #1`、`Agent #2` 遞增編號。編號在 session 存活期間固定，session 結束後號碼可回收。

### D5: dev script 架構

`scripts/dev.mjs` 用 Node.js 原生 `child_process.spawn`：
1. 讀取 `settingsStore` 的 `devPort`（預設 5173）
2. spawn Vite process: `pnpm -C src/renderer exec vite --port {port} --strictPort`
3. spawn Electron process: `tsc -p tsconfig.main.json && electron dist/main/index.js --dev-port={port}`
4. pipe stdout/stderr 加上 prefix（`[vite]` / `[electron]`）
5. 任一 process 結束 → kill 另一個

Electron main process 解析 `--dev-port` argv，未打包時使用 `loadURL`。

**為何不用 cross-env**: 多一個依賴只解決環境變數問題，dev.mjs 更靈活且能處理 port 傳遞。

### D6: Settings UI 設計

在現有 SettingsModal 新增「Watch Directories」section，風格與現有 pixel art UI 一致：
- 目錄清單，每項有刪除按鈕
- 「Add Claude Root」按鈕 — 自動加入 `~/.claude/projects`
- 「Add Project」按鈕 — 觸發 Electron 目錄選擇 dialog
- Active Threshold 數字輸入
- 設定變更即時生效並儲存

## Risks / Trade-offs

- [大量 JSONL 檔案] → 只讀 mtime 不讀內容做初篩，活躍的才開始 tail。`~/.claude/projects` 可能有上百個歷史 session，mtime 過濾後通常只有個位數。
- [掃描頻率 vs 回應速度] → 30 秒掃描間隔在新 session 啟動後最多延遲 30 秒才出現。可接受。
- [跨平台路徑] → `~` 在 Windows 需展開為 `%USERPROFILE%`，dev.mjs 用 `os.homedir()` 處理。
