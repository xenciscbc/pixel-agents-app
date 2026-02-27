## MODIFIED Requirements

### Requirement: SettingsModal Network section 新增 Heartbeat Interval (modified)
SettingsModal 的 Network section SHALL 新增 Heartbeat Interval 數字輸入欄位。

#### Scenario: Heartbeat Interval input
- **WHEN** SettingsModal 開啟
- **THEN** Network section 顯示 "Heartbeat Interval" number input（單位：秒），預設值為 scanIntervalSeconds
