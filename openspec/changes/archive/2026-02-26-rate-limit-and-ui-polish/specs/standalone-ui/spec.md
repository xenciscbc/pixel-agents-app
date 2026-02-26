## MODIFIED Requirements

### Requirement: AgentListPanel 狀態顯示 (modified)
AgentListPanel SHALL 支援 rate_limited 狀態，顯示為紅色 "Rest"。

#### Scenario: rate_limited agent 在 list 中
- **WHEN** agent 狀態為 rate_limited
- **THEN** 顯示紅色 dot + "Rest" 文字

---

### Requirement: 移除 AgentListPanel 粗體字
AgentListPanel SHALL 不使用 `fontWeight: 'bold'`。

#### Scenario: Project header 不使用粗體
- **WHEN** AgentListPanel 渲染 project header
- **THEN** 不套用 fontWeight: 'bold'

---

### Requirement: AgentListPanel 字體縮放 (modified)
AgentListPanel SHALL 根據 `fontScale` 設定縮放所有 fontSize。

#### Scenario: fontScale 套用
- **WHEN** fontScale 變更
- **THEN** 標題、project header、agent label、status、sub-agent 的 fontSize 等比例縮放

---

### Requirement: AgentLabels 字體縮放 (modified)
AgentLabels tooltip SHALL 根據 `fontScale` 設定縮放 fontSize。

#### Scenario: fontScale 套用至 tooltip
- **WHEN** fontScale 變更
- **THEN** tooltip 中的 agent label 和 status text fontSize 等比例縮放
