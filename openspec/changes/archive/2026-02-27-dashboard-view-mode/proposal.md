## Why

使用者需要更細緻的音效控制（目前 waiting 和 rate_limited 都會播音效，但不是每種事件都需要），以及查看 agent 的最近狀態歷史（目前只能看到當前狀態，無法知道 agent 剛才在做什麼）。

## What Changes

- 新增 Sound 細項設定：每個狀態事件（waiting、rest、needs approval、idle）可獨立開關音效，取代原有的單一 sound toggle
- 新增狀態歷史記錄：在 renderer 端追蹤每個 agent（含遠端）的最近 10 筆連續去重狀態事件
- 新增 Agent 狀態歷史 Popup：所有 view（Office、List、Dashboard）點擊 agent 時顯示最近狀態歷史的彈出視窗
- 移除 Dashboard/Office 點擊時的空操作 `focusAgent`，改為開啟歷史 popup

## Capabilities

### New Capabilities
- `status-history`: Agent 狀態歷史記錄與 popup 顯示（資料收集、連續去重、UI popup 元件）

### Modified Capabilities
- `settings-ui`: Sound section 改為細項設定（waiting/rest/needs approval/idle 各自開關），原有 Sound Notifications toggle 移入此 section 作為總開關
- `standalone-ui`: 音效播放邏輯從固定的 waiting+rate_limited 改為依設定判斷各事件是否播音效；新增 statusHistory state
- `dashboard-view`: 點擊 agent card 改為開啟狀態歷史 popup（取代空操作 focusAgent）；遠端 agent card 也可點擊查看歷史

## Impact

- 修改 `src/main/settingsStore.ts`（新增 soundSettings key）
- 修改 `src/main/agentController.ts`（新增 soundSettings IPC handler）
- 修改 `src/renderer/src/notificationSound.ts`（依事件類型判斷是否播音效）
- 修改 `src/renderer/src/hooks/useExtensionMessages.ts`（新增 statusHistory state、修改音效觸發邏輯）
- 修改 `src/renderer/src/components/SettingsModal.tsx`（Sound section 細項 UI）
- 修改 `src/renderer/src/components/DashboardView.tsx`（點擊 popup）
- 修改 `src/renderer/src/components/AgentListPanel.tsx`（點擊 popup）
- 修改 `src/renderer/src/components/AgentLabels.tsx`（點擊 popup）
- 新增 `src/renderer/src/components/StatusHistoryPopup.tsx`（popup 元件）
- 修改 `src/renderer/src/App.tsx`（傳遞 statusHistory、管理 popup state）
