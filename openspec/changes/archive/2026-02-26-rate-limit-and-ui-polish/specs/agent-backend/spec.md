## MODIFIED Requirements

### Requirement: Agent 狀態偵測 (modified)
transcriptParser SHALL 在處理 assistant record 時優先檢查 error 欄位，新增 rate_limit 偵測。

#### Scenario: rate_limit error 處理
- **WHEN** JSONL assistant record 帶有 `error: "rate_limit"`
- **THEN** 清除 active tools、取消 timers，發送 `agentStatus: 'rate_limited'`
