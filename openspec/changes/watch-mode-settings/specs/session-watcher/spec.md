## ADDED Requirements

### Requirement: 多目錄 JSONL 掃描
系統須支援設定多個監控目錄，定期掃描目錄下的 `*.jsonl` 檔案以發現 Claude Code sessions。支援兩種目錄類型：`claude-root`（掃描所有子目錄）及 `project`（直接監控該目錄）。

#### Scenario: 掃描 Claude Root 目錄
- **WHEN** watchDirs 包含 `{ type: "claude-root", path: "~/.claude/projects" }`
- **THEN** 系統列舉該路徑下所有子目錄，並掃描每個子目錄內的 `*.jsonl` 檔案

#### Scenario: 掃描單一專案目錄
- **WHEN** watchDirs 包含 `{ type: "project", path: "D:/work/foo/.claude" }`
- **THEN** 系統直接掃描該目錄內的 `*.jsonl` 檔案

#### Scenario: 無設定時不掃描
- **WHEN** watchDirs 為空陣列
- **THEN** 系統不執行掃描，辦公室顯示為空

### Requirement: 活躍 session 判定
系統須根據 JSONL 檔案的最後修改時間（mtime）判定 session 是否活躍。閾值可由使用者設定，預設 30 分鐘。

#### Scenario: 活躍 session 發現
- **WHEN** 掃描發現 JSONL 檔案的 mtime 距今小於 activeThresholdMinutes
- **THEN** 該 session 被判定為活躍，建立觀察 agent

#### Scenario: 過期 session 清理
- **WHEN** 已存在的觀察 agent 對應的 JSONL 超過閾值未更新
- **THEN** 該 agent 被標記為 idle 並在下次掃描時移除

#### Scenario: 自訂閾值
- **WHEN** 使用者設定 activeThresholdMinutes 為 60
- **THEN** 只有最近 60 分鐘內有活動的 sessions 才被判定為活躍

### Requirement: 純觀察模式 agent
系統須以觀察模式建立 agent — 只讀取並解析 JSONL 內容，不 spawn 或 kill Claude CLI process。

#### Scenario: 觀察 agent 建立
- **WHEN** 發現活躍 session
- **THEN** 建立 mode 為 `observe` 的 agent，開始 tail 對應的 JSONL 檔案

#### Scenario: 觀察 agent 狀態解析
- **WHEN** 觀察 agent 正在 tail JSONL
- **THEN** 系統透過 transcriptParser 解析 agent 狀態（active/waiting/permission），並更新 UI 顯示

#### Scenario: 觀察 agent 不可控制
- **WHEN** agent mode 為 `observe`
- **THEN** UI 不顯示 close button，使用者無法終止該 agent

### Requirement: Agent 自動編號
觀察模式的 agent 須以遞增編號作為 label（Agent #1、Agent #2...）。

#### Scenario: 編號分配
- **WHEN** 新的觀察 agent 建立
- **THEN** 分配下一個可用編號作為 label

#### Scenario: 編號回收
- **WHEN** 觀察 agent 因 session 過期被移除
- **THEN** 該編號可在後續新 agent 建立時重新使用

### Requirement: 定期重新掃描
系統須定期重新掃描所有 watchDirs，發現新 session 及清理過期 session。

#### Scenario: 定期掃描
- **WHEN** 距上次掃描已過 30 秒
- **THEN** 系統重新掃描所有 watchDirs，建立新發現的活躍 agent 並移除過期 agent

### Requirement: 移除首次啟動 dialog
系統啟動時不再彈出專案目錄選擇對話框，直接顯示辦公室畫面。

#### Scenario: 首次啟動
- **WHEN** 使用者首次啟動 app（無任何設定）
- **THEN** 顯示空的辦公室畫面，使用者透過 Settings 加入監控目錄
