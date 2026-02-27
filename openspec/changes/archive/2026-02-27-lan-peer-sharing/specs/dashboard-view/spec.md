## MODIFIED Requirements

### Requirement: Dashboard 遠端 agent 分組 (modified)
DashboardView SHALL 接收 remotePeers prop，以 peer name 為群組 header 顯示遠端 agents。

#### Scenario: 混合本機與遠端
- **WHEN** 同時有本機和遠端 agents
- **THEN** 本機 agents 按現有邏輯顯示（依 project 分組），遠端 agents 在下方按 peer name 分組

#### Scenario: 遠端 agent card 樣式
- **WHEN** 渲染遠端 agent card
- **THEN** 使用與本機相同的 card 樣式，但不可點擊（cursor 不變為 pointer）
