## Why

Agent 遇到 API rate limit 時，JSONL transcript 會寫入帶有 `error: "rate_limit"` 的 assistant record，但目前 transcriptParser 不處理此情況，導致 agent 被誤判為 Waiting 狀態。需要新增 "Rest" 狀態以正確反映 rate limit 狀況，並播放提示音通知使用者。

同時，pixel font (FS Pixel Sans) 不支援 bold variant，瀏覽器合成粗體導致文字模糊，需移除所有 `fontWeight: 'bold'`。

此外，使用者希望能自由調整 AgentListPanel、DashboardView、AgentLabels 的字體大小，需新增 Font Scale 設定（0.5x ~ 3.0x slider），並持久化至 settings。

## What Changes

- 在 transcriptParser 偵測 `record.error === "rate_limit"` 並發送 `agentStatus: 'rate_limited'`
- 清除該 agent 的 active tools（與 turn_duration 類似處理）
- rate_limited 狀態觸發提示音（複用現有 playDoneSound 機制）
- 所有 UI 元件（AgentListPanel、DashboardView、AgentLabels）新增 rate_limited 狀態顯示：紅色 dot + "Rest" 文字
- 移除 AgentListPanel 和 DashboardView 中的 `fontWeight: 'bold'`
- 新增 Font Scale 設定：透過 Settings slider 調整 UI 字體縮放比例，持久化至 disk

## Capabilities

### New Capabilities
- `rate-limit-status`: 偵測 API rate limit 並顯示 "Rest" 狀態（紅色），含提示音通知
- `font-scale`: 使用者可透過 Settings 調整 UI 字體縮放比例

### Modified Capabilities
- `agent-backend`: transcriptParser 新增 rate_limit error 偵測邏輯
- `dashboard-view`: AgentCard 新增 rate_limited 狀態顯示，移除粗體字
- `standalone-ui`: AgentListPanel 和 AgentLabels 新增 rate_limited 狀態顯示，移除粗體字
- `settings-ui`: SettingsModal 新增 Font Scale slider

## Impact

- `src/main/transcriptParser.ts` — 新增 rate_limit 偵測分支
- `src/main/timerManager.ts` — 可能需調整（rate_limited 需觸發 done sound）
- `src/renderer/src/components/AgentListPanel.tsx` — 狀態顯示 + 移除 bold
- `src/renderer/src/components/DashboardView.tsx` — 狀態顯示 + 移除 bold
- `src/renderer/src/components/AgentLabels.tsx` — 狀態顯示 + fontScale
- `src/main/settingsStore.ts` — 新增 fontScale 設定
- `src/main/agentController.ts` — 新增 fontScale IPC handlers
- `src/renderer/src/hooks/useExtensionMessages.ts` — fontScale state
- `src/renderer/src/App.tsx` — 傳遞 fontScale
- `src/renderer/src/components/BottomToolbar.tsx` — 透傳 fontScale
- `src/renderer/src/components/SettingsModal.tsx` — Font Scale slider UI
