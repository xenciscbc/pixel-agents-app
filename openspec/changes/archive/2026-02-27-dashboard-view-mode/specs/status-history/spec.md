## ADDED Requirements

### Requirement: 狀態歷史記錄
系統 SHALL 為每個 agent（本機與遠端）記錄最近的狀態事件，連續去重後保留最多 10 筆。

#### Scenario: 本機 agent 工具啟動
- **WHEN** 收到 `agentToolStart` 訊息
- **THEN** 將 tool status 文字推入該 agent 的歷史（如 "Reading foo.ts"），若與最近一筆相同則跳過

#### Scenario: 本機 agent 狀態變更
- **WHEN** 收到 `agentStatus` 訊息（waiting / rate_limited / active）
- **THEN** 將對應文字（"Waiting" / "Rest" / "Active"）推入歷史，連續去重

#### Scenario: 本機 agent 需要 approval
- **WHEN** 收到 `agentToolPermission` 訊息
- **THEN** 推入 "Needs approval" 至歷史

#### Scenario: 遠端 agent 狀態變化
- **WHEN** 收到 `remotePeersUpdated` 且某遠端 agent 的 status 或 currentTool 與上次不同
- **THEN** 將變化的狀態推入該遠端 agent 的歷史（使用負數 ID）

#### Scenario: 歷史上限
- **WHEN** 歷史記錄超過 10 筆
- **THEN** 截斷至最近 10 筆

#### Scenario: 連續去重
- **WHEN** 新狀態與歷史最近一筆相同
- **THEN** 不重複推入

---

### Requirement: 狀態歷史 Popup
系統 SHALL 提供 popup 元件，點擊任何 agent 時顯示其最近狀態歷史。

#### Scenario: 點擊本機 agent 開啟 popup
- **WHEN** 使用者在任何 view（Office / List / Dashboard）點擊本機 agent
- **THEN** 顯示包含 agent label 和最近 10 筆歷史的 popup

#### Scenario: 點擊遠端 agent 開啟 popup
- **WHEN** 使用者在任何 view 點擊遠端 agent
- **THEN** 顯示該遠端 agent 的歷史 popup

#### Scenario: 關閉 popup
- **WHEN** 使用者點擊 popup 右上角 ✕ 或點擊 popup 外部
- **THEN** popup 關閉

#### Scenario: 同時只開一個
- **WHEN** 已有 popup 開啟時點擊另一個 agent
- **THEN** 前一個 popup 關閉，新的 popup 開啟

#### Scenario: 無歷史紀錄
- **WHEN** agent 尚無任何狀態歷史
- **THEN** popup 顯示空狀態提示（如 "No activity yet"）
