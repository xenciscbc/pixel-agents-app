## ADDED Requirements

### Requirement: UDP Heartbeat 接收
系統 SHALL 監聽 UDP port 接收來自區網其他 peer 的 heartbeat。

#### Scenario: 接收 heartbeat
- **WHEN** 收到有效的 v1 heartbeat JSON
- **THEN** 解析並 upsert 到 peers Map（更新 name、agents、lastSeen）

#### Scenario: 過濾自己
- **WHEN** 收到 heartbeat 且 peerId 等於本機 peerId
- **THEN** 忽略此 heartbeat

#### Scenario: 無效 payload
- **WHEN** 收到無法解析的 UDP 封包
- **THEN** 靜默忽略，不影響其他功能

---

### Requirement: Peer 超時移除
系統 SHALL 在 peer 超過 `heartbeatInterval × 3` 未發送 heartbeat 時自動移除（預設 90 秒）。

#### Scenario: Peer 離線
- **WHEN** 某 peer 的 lastSeen 超過 `heartbeatInterval * 3`
- **THEN** 從 peers Map 移除，觸發 onPeersChanged callback

#### Scenario: Peer 恢復
- **WHEN** 已移除的 peer 重新發送 heartbeat
- **THEN** 重新加入 peers Map

---

### Requirement: Peers Changed 通知
peerDiscovery SHALL 在 peers 資料變更時通知呼叫者。

#### Scenario: 新 peer 加入
- **WHEN** 首次收到某 peerId 的 heartbeat
- **THEN** 觸發 onPeersChanged，提供完整 peers snapshot

#### Scenario: Peer 狀態更新
- **WHEN** 已知 peer 的 agents 資料有變化
- **THEN** 觸發 onPeersChanged

#### Scenario: Peer 移除
- **WHEN** peer 超時被移除
- **THEN** 觸發 onPeersChanged
