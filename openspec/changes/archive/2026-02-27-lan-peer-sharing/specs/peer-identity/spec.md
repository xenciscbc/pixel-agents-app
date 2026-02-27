## MODIFIED Requirements

### Requirement: Heartbeat 間隔設定 (added)
系統 SHALL 提供 `heartbeatInterval` 設定（單位：秒），控制 UDP heartbeat 發送頻率。預設值等於 `scanIntervalSeconds`（預設 30 秒）。

#### Scenario: 預設值
- **WHEN** heartbeatInterval 未設定
- **THEN** 使用 `scanIntervalSeconds` 的值作為預設（預設 30 秒）

#### Scenario: 自訂間隔
- **WHEN** 使用者在 Settings 中修改 Heartbeat Interval
- **THEN** 新間隔保存至 disk，broadcast 以新間隔重新啟動
