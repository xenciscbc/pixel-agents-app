## Why

團隊中多台電腦各自執行 agent-viewer，但無法看到其他人的 agent 狀態。需要在區網內自動發現並顯示遠端 peer 的 agent，讓團隊成員能即時掌握所有人的 Claude agent 工作狀態。

## What Changes

- 新增 UDP broadcast 模組，定期廣播本機 agent 狀態摘要
- 新增 peer discovery 模組，接收並管理遠端 peer 資料
- Renderer 新增 `remotePeers` state，透過 IPC 接收遠端 peer 資訊
- Office view：遠端 agent 與本機外觀相同，hover 時 label 顯示 `[peerName] Agent #1`
- List view：以 peer name 為群組 header 分組顯示遠端 agents
- Dashboard view：同 list 的分組邏輯

## Capabilities

### New Capabilities
- `peer-broadcast`: UDP 廣播本機 agent 狀態（heartbeat 協定、發送邏輯）
- `peer-discovery`: 接收遠端 heartbeat、管理 peer 生命週期（超時移除）
- `remote-agent-display`: 遠端 agent 在 Office / List / Dashboard 中的顯示邏輯

### Modified Capabilities
- `standalone-ui`: 新增 remotePeers state 及 IPC 訊息處理
- `peer-identity`: 新增 `heartbeatInterval` 設定（預設等於 scanIntervalSeconds）
- `settings-ui`: 新增 Heartbeat Interval 輸入欄位
- `dashboard-view`: 新增遠端 agent 分組顯示
- `ipc-bridge`: 新增 remotePeers 相關 IPC 訊息

## Impact

- 新增 `src/main/peerBroadcast.ts`、`src/main/peerDiscovery.ts`
- 修改 `agentController.ts`（整合 broadcast/discovery、IPC 轉發）
- 修改 `useExtensionMessages.ts`（新增 remotePeers state）
- 修改 `App.tsx`（傳遞 remotePeers 到子元件）
- 修改 `AgentListPanel.tsx`、`DashboardView.tsx`、`AgentLabels.tsx`（顯示遠端 agents）
- 修改 `OfficeCanvas` 相關邏輯（遠端 agent 角色加入 office）
- 依賴 `window-controls` change 已實作的 peerName、broadcastEnabled、udpPort 設定
- 需要 Node.js `dgram` 模組（內建，無需額外 dependency）
