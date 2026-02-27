## Context

agent-viewer 的音效目前在 `waiting` 和 `rate_limited` 時無條件播放（若總開關開啟）。使用者希望能針對不同事件類型獨立控制。此外，目前各 view 的點擊行為是空操作（`focusAgent` 在 standalone 模式下無功能），適合改為顯示 agent 的最近狀態歷史。

## Goals / Non-Goals

**Goals:**
- Sound 細項設定：各事件類型獨立開關，持久化
- 狀態歷史記錄：本機即時、遠端 heartbeat diff，連續去重保留 10 筆
- 歷史 Popup：所有 view 點擊 agent 即可查看，含遠端 agent

**Non-Goals:**
- 不更改音效本身（音調、音量）
- 不做歷史紀錄持久化（記憶體即可，重啟清除）
- 不做遠端 agent 操作功能

## Decisions

### 1. Sound Settings 資料結構

**選擇**: 單一 `soundSettings` object 存入 settingsStore。

```typescript
interface SoundSettings {
  enabled: boolean       // 總開關（原有 soundEnabled 遷移至此）
  waiting: boolean       // 預設 true
  rest: boolean          // 預設 true（rate_limited）
  needsApproval: boolean // 預設 true
  idle: boolean          // 預設 false
}
```

**IPC**: `setSoundSettings` → 存 disk → 回傳 `soundSettingsLoaded`。啟動時 `handleWebviewReady` 發送初始值。

**遷移**: 原有的 `soundEnabled` key 不刪除，`getSoundSettings()` 讀取時若無 `soundSettings` key，則 fallback 到讀取舊 `soundEnabled` 值作為 `enabled` 欄位預設。

**理由**: 單一 object 比多個獨立 key 更好管理，IPC 一次傳送，減少 handler 數量。

### 2. 音效觸發點重構

**選擇**: 從 `useExtensionMessages` 的 message handler 中直接判斷。

現有觸發點（`agentStatus` handler line 285-288）改為：
- `waiting` → 檢查 `soundSettings.waiting`
- `rate_limited` → 檢查 `soundSettings.rest`

新增觸發點：
- `agentToolPermission` handler → 檢查 `soundSettings.needsApproval`
- agent 變為 idle 時（`agentToolsClear` 且無 active tool）→ 檢查 `soundSettings.idle`

所有觸發前先檢查 `soundSettings.enabled`（總開關）。

**理由**: 保持觸發邏輯在資料來源端（message handler），不分散到多個元件。

### 3. 狀態歷史資料結構

**選擇**: `statusHistory: Record<number, string[]>` state in `useExtensionMessages`。

- key 為 agentId（本機正數、遠端負數 ID 均適用）
- value 為 string array，index 0 = 最新
- 連續去重：push 前比對 `history[0]`，相同則跳過
- 上限 10 筆，超過截斷

**觸發 push 的時機**:
- `agentToolStart` → push `status` (如 "Reading foo.ts")
- `agentStatus: waiting` → push "Waiting"
- `agentStatus: rate_limited` → push "Rest"
- `agentStatus: active` → push "Active"
- `agentToolPermission` → push "Needs approval"
- `remotePeersUpdated` → diff 前後快照，為每個遠端 agent 推送變化的 status/currentTool

**遠端 agent 歷史**: 在 `remotePeersUpdated` handler 中，比對新舊 peers snapshot。對每個遠端 agent，若 `currentTool` 或 `status` 有變化，push 對應的文字。使用 `useRef` 保存上一次的 peers 以做 diff。遠端 agent 的 key 使用同一套負數 ID（`-(hash * 1000 + ra.id)`）。

**理由**: 全部放在 `useExtensionMessages` 中統一管理，與其他 agent state 一致。record key 使用 agentId 可同時涵蓋本機和遠端。

### 4. Popup 元件

**選擇**: 新建 `StatusHistoryPopup.tsx`，absolute positioned overlay。

```
Props:
  agentId: number
  agentLabel: string
  history: string[]
  position: { x: number, y: number }
  fontScale: number
  onClose: () => void
```

- 以 pixel art 風格呈現（`--pixel-border`、`--pixel-bg` 等 CSS 變數）
- 右上角 ✕ 按鈕關閉
- 點擊 popup 外部也關閉（document click listener）
- 同時只能開一個（App 層管理 state）

**App 層 state**:
```typescript
const [historyPopup, setHistoryPopup] = useState<{
  agentId: number
  label: string
  position: { x: number; y: number }
} | null>(null)
```

### 5. 各 View 的點擊整合

**Office view**: `AgentLabels` 的 hover area 已有 click 能力。改為 `onClick` 觸發 popup（取代原本的 `handleClick → focusAgent`）。popup position 取角色的螢幕座標。

**List view (AgentListPanel)**: agent row 目前無 click handler。新增 `onClick` prop，點擊 agent row 觸發 popup。popup position 使用 click event 的 `clientX/clientY`。

**Dashboard view**: `AgentCard` 的 `onClick` 改為觸發 popup（取代 `onClickAgent → focusAgent`）。遠端 agent card 也加 onClick。popup position 使用 click event。

**共通**: 所有 view 傳入一個 `onAgentClick: (agentId: number, label: string, position: { x: number; y: number }) => void` callback，由 App 統一管理 popup state。

## Risks / Trade-offs

- **[Sound 遷移]** 舊版 `soundEnabled` 設定需要平滑遷移 → fallback 讀取舊值，不刪除舊 key
- **[遠端歷史精度]** heartbeat 間隔 30s，中間的狀態變化會丟失 → 可接受，遠端歷史本身只是輔助
- **[記憶體]** 每個 agent 保留 10 筆歷史 → 微量，不構成問題
- **[Popup 定位]** Office view 的 popup 需要考慮 zoom/pan → 使用螢幕座標而非 canvas 座標
