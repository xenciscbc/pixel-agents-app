## Context

agent-viewer 是 Electron 應用，本機透過 `sessionWatcher.ts` 掃描 Claude session 目錄，`transcriptParser.ts` 解析 transcript，`agentController.ts` 管理 agent 狀態並透過 IPC 推送至 renderer。`window-controls` change 已實作 peerName、broadcastEnabled、udpPort 設定。現在需要實作 UDP broadcast 讓同一區網的 agent-viewer instances 互相看到彼此的 agent。

## Goals / Non-Goals

**Goals:**
- 零設定 LAN peer discovery（同 subnet 自動發現）
- 唯讀顯示遠端 agents（Office / List / Dashboard）
- 遠端 agent 與本機外觀相同，透過 label 區分來源
- 可關閉廣播（broadcastEnabled setting）

**Non-Goals:**
- 不支援跨 subnet / WAN
- 不支援操作遠端 agent（只看）
- 不支援遠端 agent 的 transcript 詳情
- 不處理 NAT traversal

## Decisions

### 1. UDP Broadcast Protocol

**選擇**: JSON over UDP broadcast，heartbeat 間隔由獨立的 `heartbeatInterval` 設定控制（預設值等於 `scanIntervalSeconds`，預設 30 秒），使用者可自訂為不同值。

**Heartbeat 格式**:
```json
{
  "v": 1,
  "type": "heartbeat",
  "peerId": "<uuid>",
  "name": "<peerName>",
  "agents": [
    {
      "id": 1,
      "label": "Agent #1",
      "projectDir": "tt-info",
      "status": "active",
      "currentTool": "Reading foo.ts",
      "subagents": [
        { "label": "explore codebase", "currentTool": "Searching..." }
      ]
    }
  ]
}
```

**理由**: UDP broadcast 零設定、低延遲。預設與掃描間隔同步，但可獨立調整以平衡即時性與網路負載。JSON 可讀性好，payload 在 LAN 環境下 < 2KB 無需分片。

**替代方案考量**:
- TCP server: 需要手動輸入 IP 或額外 discovery 機制，複雜度高
- mDNS/Bonjour: 跨平台支援不一致

### 2. Peer 生命週期管理

**選擇**: 超時時間為 `heartbeatInterval` 的 3 倍（預設 30s × 3 = 90s）。

**實作**:
- `peerDiscovery.ts` 維護 `Map<peerId, PeerState>`
- 收到 heartbeat → upsert peer（更新 name、agents、lastSeen）
- 每秒檢查 → `lastSeen > heartbeatInterval * 3` → 移除 peer → 通知 renderer
- `startDiscovery` 接收 `getHeartbeatInterval` callback 以動態取得當前間隔

**理由**: 3 次 heartbeat miss 後移除，避免偶爾掉包誤判。與 heartbeat 間隔連動確保行為一致。

### 3. Main Process 模組拆分

**選擇**: 兩個新模組 + agentController 整合。

- `peerBroadcast.ts` — 負責發送 heartbeat
  - `start(getAgents, settings)` / `stop()`
  - 從 agentController 取得本機 agent 狀態，組裝 heartbeat payload

- `peerDiscovery.ts` — 負責接收 + 管理 peers
  - `start(port, onPeersChanged)` / `stop()`
  - 過濾自己的 peerId
  - 超時清理

- `agentController.ts` — 整合
  - 啟動/停止 broadcast 和 discovery
  - 收到 peers changed → IPC 推送 `remotePeersUpdated` 給 renderer
  - 處理 broadcastEnabled 變更 → 重啟/停止 broadcast

**理由**: 職責分離，broadcast 和 discovery 獨立測試。agentController 作為協調層。

### 4. Renderer 端 RemotePeer 資料結構

**選擇**: `remotePeers: Map<string, RemotePeer>` state in `useExtensionMessages.ts`。

```typescript
interface RemoteAgent {
  id: number
  label: string
  projectDir: string
  status: 'active' | 'waiting' | 'rate_limited'
  currentTool?: string
  subagents: { label: string; currentTool?: string }[]
}

interface RemotePeer {
  peerId: string
  name: string
  agents: RemoteAgent[]
}
```

IPC 訊息 `remotePeersUpdated` 攜帶完整的 peers snapshot（非增量），renderer 直接替換整個 Map。

**理由**: 全量替換簡單可靠，避免增量同步的複雜邊界情況。payload 小（數個 peer × 數個 agent）不會造成效能問題。

### 5. UI 整合策略

**Office view**:
- 遠端 agents 透過 `officeState.addAgent()` 加入，與本機相同外觀
- AgentLabels 的 hover tooltip 加上 `[peerName]` prefix
- 遠端 agent 不可 click（無 focusAgent）

**List view (AgentListPanel)**:
- 本機 agents 顯示在最前（現有邏輯不變）
- 每個 remote peer 作為一個群組，header 為 peer name
- 群組內的 agents 用與本機相同的 card 風格

**Dashboard view**:
- 同 list 的分組邏輯
- 遠端 agent card 與本機相同，但不可點擊

### 6. peerId 產生

**選擇**: 每次 app 啟動時 `crypto.randomUUID()` 產生 peerId。

**理由**: 不需要跨重啟持久化（重啟後是新 session），UUID 避免衝突。用於 discovery 過濾自己的 heartbeat。

## Risks / Trade-offs

- **[UDP 防火牆]** 企業防火牆可能阻擋 UDP broadcast → 使用者需開放 port 47800。可在 Settings 中自訂 port。
- **[大量 agents]** 多 peer 各有大量 agents 時 heartbeat payload 增大 → 實際場景中不太可能超過 10 個 peer、每 peer 10 個 agent，payload < 5KB。
- **[Broadcast storm]** 多台機器同時 broadcast → heartbeat 間隔預設 30 秒夠稀疏，LAN 環境無問題。
- **[IP 衝突 / 多網卡]** broadcast address 選擇 → 使用 `0.0.0.0` 綁定，broadcast 到 `255.255.255.255`，讓 OS 決定路由。
