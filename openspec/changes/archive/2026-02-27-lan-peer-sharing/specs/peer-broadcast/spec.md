## ADDED Requirements

### Requirement: UDP Heartbeat 廣播
系統 SHALL 定期透過 UDP broadcast 發送本機 agent 狀態摘要。

#### Scenario: 正常廣播
- **WHEN** broadcastEnabled 為 true 且 peerBroadcast 已啟動
- **THEN** 以 `heartbeatInterval` 設定的間隔（預設等於 scanIntervalSeconds，預設 30 秒）透過 UDP broadcast 發送 JSON heartbeat 到設定的 port

#### Scenario: Heartbeat payload
- **WHEN** heartbeat 觸發
- **THEN** payload 包含 v(版本)、type("heartbeat")、peerId、name(peerName)、agents 陣列（id、label、projectDir、status、currentTool、subagents）

#### Scenario: 停用廣播
- **WHEN** broadcastEnabled 為 false
- **THEN** 不發送任何 UDP 封包

#### Scenario: 動態切換
- **WHEN** 使用者在 Settings 中切換 broadcastEnabled
- **THEN** 即時啟動或停止 broadcast，無需重啟

---

### Requirement: Agent 狀態快照
peerBroadcast SHALL 從 agentController 取得本機 agent 狀態，組裝為精簡的 heartbeat payload。

#### Scenario: 狀態映射
- **WHEN** 組裝 heartbeat
- **THEN** 每個本機 agent 映射為 { id, label, projectDir, status, currentTool, subagents }

#### Scenario: 無 active agents
- **WHEN** 本機無 active agents
- **THEN** heartbeat 仍發送，agents 陣列為空
