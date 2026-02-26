## 1. Dev Script 重構

- [x] 1.1 建立 `scripts/dev.mjs` — 讀取 settingsStore 的 devPort（預設 5173），spawn Vite 和 Electron 子 process，加 prefix 輸出，連鎖退出
- [x] 1.2 修改 `src/main/index.ts` — 解析 `--dev-port` argv 參數，未打包時用該 port 載入 Vite dev server（fallback 5173）
- [x] 1.3 更新 `package.json` — dev script 改為 `node scripts/dev.mjs`，移除 `concurrently` devDependency

## 2. Settings 資料層

- [x] 2.1 在 `settingsStore.ts` 新增 watchDirs、activeThresholdMinutes、devPort 的 getter/setter 及型別定義
- [x] 2.2 移除 `src/main/index.ts` 首次啟動的專案目錄選擇 dialog，改為直接建立視窗

## 3. Session Watcher 核心

- [x] 3.1 建立 `src/main/sessionWatcher.ts` — 實作 `SessionWatcher` 類別，負責定期掃描 watchDirs、展開 claude-root 子目錄、列舉 JSONL 檔案
- [x] 3.2 實作活躍 session 判定 — 讀取 JSONL mtime，與 activeThresholdMinutes 比較，回傳活躍 session 清單
- [x] 3.3 實作掃描排程 — 每 30 秒觸發一次掃描，diff 與上次結果比對，產生 added/removed events
- [x] 3.4 實作跨平台路徑展開 — `~` 展開為 `os.homedir()`，正規化 Windows/macOS 路徑差異

## 4. 觀察模式 Agent

- [x] 4.1 在 `types.ts` 新增 `AgentMode` 型別（`'observe' | 'managed'`），AgentState 加入 mode 欄位
- [x] 4.2 在 `agentController.ts` 新增 `addObserveAgent(jsonlPath)` 方法 — 建立觀察 agent、啟動 fileWatcher tail、透過 transcriptParser 解析狀態
- [x] 4.3 在 `agentController.ts` 新增 `removeObserveAgent(sessionId)` 方法 — 停止 tail、清理 agent
- [x] 4.4 實作 agent 自動編號 — 維護編號池，新 agent 取最小可用編號，移除時回收
- [x] 4.5 整合 SessionWatcher 與 AgentController — watcher 的 added/removed events 驅動 agent 建立/移除

## 5. Settings UI

- [x] 5.1 擴充 `SettingsModal.tsx` — 新增 "Watch Directories" section，顯示目錄清單（含類型標示及刪除按鈕）
- [x] 5.2 實作 "Add Claude Root" 按鈕 — 自動加入 `~/.claude/projects` 類型目錄
- [x] 5.3 實作 "Add Project" 按鈕 — 透過 IPC 觸發 Electron 目錄選擇 dialog，回傳路徑後加入清單
- [x] 5.4 實作 Active Threshold 數字輸入欄位（預設 30）
- [x] 5.5 實作設定變更 IPC — renderer 透過 postMessage 通知 main process 設定變更，main process 儲存並觸發 watcher 重新掃描

## 6. 整合與測試

- [x] 6.1 端對端流程驗證 — 啟動 app → 從 Settings 加入 Claude Root → 觀察 agent 自動出現
- [x] 6.2 驗證 `pnpm run dev` 使用新 dev script 正常啟動（Windows 環境）
- [x] 6.3 驗證設定持久化 — 關閉 app 重新啟動後，設定自動載入並恢復監控
