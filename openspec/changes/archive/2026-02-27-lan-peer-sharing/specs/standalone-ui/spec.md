## MODIFIED Requirements

### Requirement: Renderer 新增 remotePeers state (modified)
useExtensionMessages hook SHALL 新增 `remotePeers` state 管理遠端 peer 資料。

#### Scenario: 初始狀態
- **WHEN** app 啟動
- **THEN** remotePeers 為空 Map

#### Scenario: 接收 remotePeersUpdated
- **WHEN** 收到 `remotePeersUpdated` IPC 訊息
- **THEN** 以 peers snapshot 替換整個 remotePeers Map

#### Scenario: Peer 移除
- **WHEN** 收到不含某 peerId 的 snapshot
- **THEN** 該 peer 從 remotePeers 中消失，UI 即時更新
