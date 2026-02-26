## MODIFIED Requirements

### Requirement: Agent 卡片狀態顯示 (modified)
DashboardView AgentCard SHALL 支援 rate_limited 狀態，顯示為紅色 "Rest"。

#### Scenario: rate_limited agent 卡片
- **WHEN** agent 狀態為 rate_limited
- **THEN** 卡片顯示紅色 dot + "Rest" 文字

---

### Requirement: 移除粗體字
DashboardView SHALL 不使用 `fontWeight: 'bold'`，因 pixel font 不支援 bold variant。

#### Scenario: Agent label 不使用粗體
- **WHEN** DashboardView 渲染 agent label
- **THEN** 不套用 fontWeight: 'bold'

#### Scenario: Project header 不使用粗體
- **WHEN** DashboardView 渲染 project group header
- **THEN** 不套用 fontWeight: 'bold'

---

### Requirement: DashboardView 字體縮放 (modified)
DashboardView SHALL 根據 `fontScale` 設定縮放所有 fontSize。

#### Scenario: fontScale 套用至所有文字
- **WHEN** fontScale 為 N
- **THEN** 所有文字元素的 fontSize 為基礎值乘以 N（四捨五入至整數 px）
