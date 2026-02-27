## MODIFIED Requirements

### Requirement: Dashboard 遠端 agent 分組 (modified)
DashboardView SHALL 接收 remotePeers prop，以 peer name 為群組 header 顯示遠端 agents。遠端 agent card 可點擊查看歷史。

#### Scenario: 混合本機與遠端
- **WHEN** 同時有本機和遠端 agents
- **THEN** 本機 agents 按現有邏輯顯示（依 project 分組），遠端 agents 在下方按 peer name 分組

#### Scenario: 遠端 agent card 可點擊
- **WHEN** 使用者點擊遠端 agent card
- **THEN** 觸發 onAgentClick callback 開啟狀態歷史 popup

---

### Requirement: Agent 卡片顯示豐富資訊 (modified)
DashboardView 中每個 agent SHALL 以卡片形式顯示，包含 label、狀態、當前工具、sub-agent 清單、最後活動時間。點擊卡片開啟狀態歷史 popup。

#### Scenario: Active agent 卡片內容
- **WHEN** agent 處於 Active 狀態且正在執行工具
- **THEN** 卡片顯示：agent label、● Active 狀態（藍色）、當前工具狀態文字、最後活動時間

#### Scenario: 卡片顯示 sub-agent
- **WHEN** agent 有一個或多個 sub-agent 正在執行
- **THEN** 卡片顯示 "Sub-agents: N" 及每個 sub-agent 的 label 和工具狀態，以縮排方式呈現

#### Scenario: 最後活動時間顯示
- **WHEN** agent 的最後活動時間距今 2 分鐘
- **THEN** 卡片顯示 "Last: 2m ago"

#### Scenario: 最後活動時間為剛剛
- **WHEN** agent 的最後活動時間距今小於 30 秒
- **THEN** 卡片顯示 "Last: just now"

#### Scenario: 點擊開啟歷史
- **WHEN** 使用者點擊本機 agent 卡片
- **THEN** 觸發 onAgentClick callback 開啟狀態歷史 popup（取代原有的空操作 focusAgent）
