## ADDED Requirements

### Requirement: Office view 遠端 agent 顯示
遠端 agents SHALL 在 Office view 中與本機 agent 相同外觀顯示。

#### Scenario: 遠端 agent 出現
- **WHEN** 收到含 agents 的 remote peer 資料
- **THEN** 遠端 agents 加入 officeState，分配座位，顯示與本機相同的角色動畫

#### Scenario: Hover 區分來源
- **WHEN** 使用者 hover 遠端 agent
- **THEN** label 顯示 `[peerName] Agent #1` 格式，區分本機與遠端

#### Scenario: 遠端 agent 不可操作
- **WHEN** 使用者點擊遠端 agent
- **THEN** 不觸發 focusAgent（唯讀）

#### Scenario: 遠端 agent 離線
- **WHEN** remote peer 被移除
- **THEN** 其所有 agents 從 officeState 移除

---

### Requirement: List view 遠端 agent 分組
AgentListPanel SHALL 以 peer name 為群組 header 顯示遠端 agents。

#### Scenario: 遠端群組顯示
- **WHEN** 有 remote peers 資料
- **THEN** 本機 agents 顯示在最前，每個 remote peer 作為獨立群組，header 為 peer name

#### Scenario: 遠端 agent card
- **WHEN** 渲染遠端 agent card
- **THEN** 使用與本機相同的 card 風格，顯示 status、currentTool、subagents

---

### Requirement: Dashboard view 遠端 agent 分組
DashboardView SHALL 以 peer name 為群組 header 顯示遠端 agents。

#### Scenario: 遠端群組顯示
- **WHEN** 有 remote peers 資料且 viewMode 為 dashboard
- **THEN** 遠端 agents 按 peer name 分組顯示，與 list view 相同邏輯

#### Scenario: 遠端 agent card 不可點擊
- **WHEN** 使用者點擊遠端 agent card
- **THEN** 不觸發 onClickAgent
