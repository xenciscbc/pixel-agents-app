## MODIFIED Requirements

### Requirement: remotePeers IPC 訊息 (modified)
IPC bridge SHALL 支援 `remotePeersUpdated` 訊息從 main process 推送遠端 peer 資料至 renderer。

#### Scenario: remotePeersUpdated 訊息格式
- **WHEN** main process 發送 remotePeersUpdated
- **THEN** 訊息包含 `{ type: 'remotePeersUpdated', peers: RemotePeer[] }`

#### Scenario: Peers 為空
- **WHEN** 所有 remote peers 離線
- **THEN** 發送 `{ type: 'remotePeersUpdated', peers: [] }`
