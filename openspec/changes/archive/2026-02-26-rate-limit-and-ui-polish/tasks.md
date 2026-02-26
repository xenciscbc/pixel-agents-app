## 1. Backend: Rate Limit 偵測

- [x] 1.1 在 transcriptParser.ts 的 `processTranscriptLine` 中，`record.type === 'assistant'` 分支最前面加入 `record.error === 'rate_limit'` 偵測：清除 active tools、取消 timers、發送 `agentStatus: 'rate_limited'`

## 2. Renderer: 提示音與狀態處理

- [x] 2.1 在 useExtensionMessages.ts 的 `agentStatus` handler 中，`status === 'rate_limited'` 時也呼叫 `playDoneSound()`
- [x] 2.2 在 useExtensionMessages.ts 的 `agentStatus` handler 中，rate_limited 狀態正確存入 agentStatuses（不被 delete，與 waiting 相同處理）

## 3. UI: "Rest" 狀態顯示（紅色）

- [x] 3.1 AgentListPanel.tsx `getStatusInfo()` 新增 `rate_limited` 判斷：回傳 `{ text: 'Rest', color: '#e55', isPermission: false }`
- [x] 3.2 DashboardView.tsx `getStatusDisplay()` 新增 `rate_limited` 判斷：回傳 `{ text: 'Rest', color: '#e55', isPermission: false, currentTool: null }`
- [x] 3.3 AgentLabels.tsx 狀態判斷邏輯新增 `rate_limited`：顯示紅色 "Rest"

## 4. UI: 移除粗體字

- [x] 4.1 移除 AgentListPanel.tsx project header 的 `fontWeight: 'bold'`
- [x] 4.2 移除 DashboardView.tsx agent label 的 `fontWeight: 'bold'`
- [x] 4.3 移除 DashboardView.tsx project header 的 `fontWeight: 'bold'`

## 5. Font Scale 設定

- [x] 5.1 settingsStore.ts 新增 `fontScale` 設定鍵值、`getFontScale()`、`setFontScale()`
- [x] 5.2 agentController.ts 新增 `setFontScale`/`getFontScale` IPC handlers，`handleWebviewReady` 發送初始 `fontScaleLoaded`
- [x] 5.3 useExtensionMessages.ts 新增 `fontScale` state 和 `fontScaleLoaded` handler
- [x] 5.4 App.tsx 從 hook 取得 `fontScale`，傳遞給 AgentListPanel、DashboardView、AgentLabels、BottomToolbar

## 6. Font Scale UI 套用

- [x] 6.1 AgentListPanel.tsx 接收 `fontScale` prop，所有 fontSize 改用 `fs(base)` helper
- [x] 6.2 DashboardView.tsx 接收 `fontScale` prop，AgentCard 和 DashboardView 本體所有 fontSize 改用 `fs(base)`
- [x] 6.3 AgentLabels.tsx 接收 `fontScale` prop，tooltip label 和 status text 改用 `fs(base)`
- [x] 6.4 SettingsModal.tsx 新增 Font Scale section：range slider (0.5x~3.0x, step 0.1)，顯示當前值
- [x] 6.5 BottomToolbar.tsx 透傳 `fontScale` 和 `onFontScaleChange` 給 SettingsModal

## 7. 驗證

- [x] 7.1 Type check 通過（main、preload、renderer）
