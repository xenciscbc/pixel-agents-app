# rate-limit-status Specification

## Purpose

偵測 API rate limit 狀態並在 UI 中以紅色 "Rest" 顯示，通知使用者 agent 正在等待 rate limit 解除。

## Requirements

### Requirement: Rate limit 偵測與 "Rest" 狀態
系統 SHALL 偵測 JSONL transcript 中的 rate_limit error，並將 agent 狀態設為 "rate_limited"。

#### Scenario: 偵測 rate_limit error
- **WHEN** JSONL record 的 `type` 為 "assistant" 且 `error` 為 "rate_limit"
- **THEN** 清除該 agent 的所有 active tools，發送 `agentStatus: 'rate_limited'`

#### Scenario: rate_limited 狀態觸發提示音
- **WHEN** renderer 收到 `agentStatus` 為 `rate_limited`
- **THEN** 播放提示音（與 waiting 相同的 playDoneSound）

#### Scenario: rate_limited 後恢復
- **WHEN** rate_limited 的 agent 收到新的 assistant record（無 error）
- **THEN** 狀態自動回到 active 或 waiting（由現有邏輯處理）

---

### Requirement: "Rest" 狀態 UI 顯示
所有 agent 狀態顯示位置 SHALL 將 rate_limited 狀態顯示為紅色 "Rest"。

#### Scenario: AgentListPanel 顯示 Rest
- **WHEN** agent 狀態為 rate_limited
- **THEN** AgentListPanel 顯示紅色 dot + "Rest" 文字

#### Scenario: DashboardView 顯示 Rest
- **WHEN** agent 狀態為 rate_limited
- **THEN** DashboardView AgentCard 顯示紅色 dot + "Rest" 文字

#### Scenario: AgentLabels 顯示 Rest
- **WHEN** agent 狀態為 rate_limited
- **THEN** office 模式的 agent label 顯示紅色 "Rest" 狀態
