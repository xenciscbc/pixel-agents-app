## 1. Heartbeat Interval 設定

- [x] 1.1 `settingsStore.ts` 新增 `SETTINGS_KEY_HEARTBEAT_INTERVAL = 'heartbeatInterval'`
- [x] 1.2 `settingsStore.ts` 新增 `getHeartbeatInterval(): number`（預設值為 `getScanInterval()`）、`setHeartbeatInterval(seconds: number)`
- [x] 1.3 `agentController.ts` 新增 `setHeartbeatInterval` IPC handler：存入 disk，回傳 `heartbeatIntervalLoaded`，重啟 broadcast/discovery
- [x] 1.4 `agentController.ts` `handleWebviewReady` 發送 `heartbeatIntervalLoaded` 初始值
- [x] 1.5 `useExtensionMessages.ts` 新增 `heartbeatInterval` state + `heartbeatIntervalLoaded` handler
- [x] 1.6 `SettingsModal.tsx` Network section 新增 "Heartbeat Interval" number input（秒）
- [x] 1.7 `BottomToolbar.tsx` 透傳 `heartbeatInterval` + `onHeartbeatIntervalChange` props
- [x] 1.8 `App.tsx` 從 hook 取得 `heartbeatInterval`，建立 callback，傳遞給 BottomToolbar

## 2. Types 定義

- [x] 2.1 `src/main/types.ts` 新增 `RemoteAgent` interface：`{ id: number, label: string, projectDir: string, status: 'active' | 'waiting' | 'rate_limited', currentTool?: string, subagents: { label: string, currentTool?: string }[] }`
- [x] 2.2 `src/main/types.ts` 新增 `RemotePeer` interface：`{ peerId: string, name: string, agents: RemoteAgent[] }`
- [x] 2.3 `src/main/types.ts` 新增 `HeartbeatPayload` interface：`{ v: number, type: 'heartbeat', peerId: string, name: string, agents: RemoteAgent[] }`

## 3. Peer Broadcast 模組

- [x] 3.1 新建 `src/main/peerBroadcast.ts`：`import dgram`，export `startBroadcast(getAgentSnapshot, peerId, getName, getPort, getHeartbeatInterval)` 函數
- [x] 3.2 `peerBroadcast.ts` `startBroadcast` 建立 UDP socket（`dgram.createSocket('udp4')`），bind 後 `setBroadcast(true)`
- [x] 3.3 `peerBroadcast.ts` 以 `getHeartbeatInterval() * 1000` ms 間隔呼叫 `getAgentSnapshot()` 組裝 HeartbeatPayload，`socket.send()` 到 `255.255.255.255:port`
- [x] 3.4 `peerBroadcast.ts` export `stopBroadcast()` 清除 interval、關閉 socket
- [x] 3.5 `agentController.ts` 新增 `getAgentSnapshot(): RemoteAgent[]` 方法：遍歷 `this.agents`，映射為 RemoteAgent（id、label 從 agentNumbers 計算、projectDir 取最後一段、status 從 timerManager/agentStatuses 取、currentTool 取第一個 active tool status、subagents 從 activeSubagentToolNames 取）

## 4. Peer Discovery 模組

- [x] 4.1 新建 `src/main/peerDiscovery.ts`：export `startDiscovery(port, peerId, getHeartbeatInterval, onPeersChanged)` 函數
- [x] 4.2 `peerDiscovery.ts` 建立 UDP socket 綁定 port，監聽 `message` 事件
- [x] 4.3 `peerDiscovery.ts` 收到 message → JSON.parse → 驗證 `v === 1 && type === 'heartbeat'` → 過濾自己的 peerId → upsert 到 `peers: Map<string, { name, agents, lastSeen }>`
- [x] 4.4 `peerDiscovery.ts` 每 1 秒掃描 peers Map，移除 `Date.now() - lastSeen > getHeartbeatInterval() * 3 * 1000` 的 entries
- [x] 4.5 `peerDiscovery.ts` peers 變更時（新增/更新/移除）呼叫 `onPeersChanged(Array.from(peers.values()))` callback
- [x] 4.6 `peerDiscovery.ts` export `stopDiscovery()` 清除 interval、關閉 socket

## 5. AgentController 整合

- [x] 5.1 `agentController.ts` import peerBroadcast、peerDiscovery，生成 `peerId = crypto.randomUUID()`
- [x] 5.2 `agentController.ts` `init()` 或 constructor 中：若 `getBroadcastEnabled()` → `startBroadcast(...)`；`startDiscovery(getUdpPort(), peerId, getHeartbeatInterval, onPeersChanged)`
- [x] 5.3 `agentController.ts` `onPeersChanged` callback：將 peers 資料透過 `messageSender.postMessage({ type: 'remotePeersUpdated', peers })` 推送至 renderer
- [x] 5.4 `agentController.ts` `handleMessage` 的 `setBroadcastEnabled` case 中：enabled → `startBroadcast()`，disabled → `stopBroadcast()`
- [x] 5.5 `agentController.ts` `handleMessage` 的 `setUdpPort` case 中：`stopBroadcast()` + `stopDiscovery()`，以新 port 重新啟動
- [x] 5.6 `agentController.ts` `dispose()` 中呼叫 `stopBroadcast()` + `stopDiscovery()`
- [x] 5.7 `agentController.ts` `handleWebviewReady` 中發送當前 `remotePeersUpdated` 初始資料

## 6. Renderer State

- [x] 6.1 `useExtensionMessages.ts` 新增 `RemoteAgent`、`RemotePeer` interface（與 main 端相同）
- [x] 6.2 `useExtensionMessages.ts` 新增 `remotePeers: RemotePeer[]` state（預設 `[]`）
- [x] 6.3 `useExtensionMessages.ts` 新增 `remotePeersUpdated` message handler：`setRemotePeers(msg.peers)`
- [x] 6.4 `useExtensionMessages.ts` 在 return 中匯出 `remotePeers`
- [x] 6.5 `ExtensionMessageState` interface 新增 `remotePeers: RemotePeer[]`

## 7. App.tsx Props 傳遞

- [x] 7.1 `App.tsx` 從 `useExtensionMessages` 解構 `remotePeers`
- [x] 7.2 `App.tsx` 將 `remotePeers` 傳遞給 `AgentListPanel`、`DashboardView`、`AgentLabels`

## 8. Office View 遠端 Agent

- [x] 8.1 `App.tsx` 新增 `useEffect` 監聽 `remotePeers` 變化：比較前後差異，對 officeState 呼叫 `addAgent` / `removeAgent`（使用負數 ID offset 避免與本機 agent ID 衝突，如 `peerId hash * -1000 + agent.id`）
- [x] 8.2 `AgentLabels.tsx` 新增 `remotePeers` prop，遠端 agent 的 label 顯示為 `[peerName] agent.label`
- [x] 8.3 `AgentLabels.tsx` 遠端 agent hover 時顯示 status（active/waiting/rate_limited）和 currentTool

## 9. AgentListPanel 遠端分組

- [x] 9.1 `AgentListPanel.tsx` 新增 `remotePeers` prop
- [x] 9.2 `AgentListPanel.tsx` 在本機 agents 群組之後，為每個 remote peer 渲染一個群組：header 為 `peer.name`，agents 為 `peer.agents`
- [x] 9.3 `AgentListPanel.tsx` 遠端 agent card 顯示 label、status indicator、currentTool、subagents（使用現有 card 風格）

## 10. DashboardView 遠端分組

- [x] 10.1 `DashboardView.tsx` 新增 `remotePeers` prop
- [x] 10.2 `DashboardView.tsx` 在本機 agents section 之後，為每個 remote peer 渲染群組（同 list 邏輯）
- [x] 10.3 `DashboardView.tsx` 遠端 agent card 不可點擊（不觸發 `onClickAgent`）

## 11. 驗證

- [x] 11.1 Type check 通過（main、preload、renderer）
