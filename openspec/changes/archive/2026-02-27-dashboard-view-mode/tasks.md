## 1. Sound Settings 持久化

- [x] 1.1 `settingsStore.ts` 新增 `SoundSettings` interface 和 `SETTINGS_KEY_SOUND_SETTINGS`
- [x] 1.2 `settingsStore.ts` 新增 `getSoundSettings(): SoundSettings`（fallback 讀取舊 `soundEnabled`）和 `setSoundSettings(settings: SoundSettings)`
- [x] 1.3 `agentController.ts` 新增 `setSoundSettings` IPC handler：存 disk → 回傳 `soundSettingsLoaded`
- [x] 1.4 `agentController.ts` `handleWebviewReady` 發送 `soundSettingsLoaded` 初始值

## 2. Renderer Sound Settings State

- [x] 2.1 `useExtensionMessages.ts` 新增 `SoundSettings` interface 和 `soundSettings` state（預設 `{ enabled: true, waiting: true, rest: true, needsApproval: true, idle: false }`）
- [x] 2.2 `useExtensionMessages.ts` 新增 `soundSettingsLoaded` handler → `setSoundSettings(msg.soundSettings)`
- [x] 2.3 `useExtensionMessages.ts` 在 `ExtensionMessageState` interface 和 return 中匯出 `soundSettings`

## 3. 音效觸發重構

- [x] 3.1 `useExtensionMessages.ts` 修改 `agentStatus` handler：waiting 時檢查 `soundSettings.enabled && soundSettings.waiting`，rate_limited 時檢查 `soundSettings.enabled && soundSettings.rest`
- [x] 3.2 `useExtensionMessages.ts` 在 `agentToolPermission` handler 新增：檢查 `soundSettings.enabled && soundSettings.needsApproval` → `playDoneSound()`
- [x] 3.3 `useExtensionMessages.ts` 在 `agentToolsClear` handler 新增：若無其他 active tool 且 `soundSettings.enabled && soundSettings.idle` → `playDoneSound()`
- [x] 3.4 `notificationSound.ts` 移除舊的 `soundEnabled` 全域變數邏輯（`setSoundEnabled`、`isSoundEnabled` 內部 guard），改為由呼叫端控制

## 4. Sound Settings UI

- [x] 4.1 `SettingsModal.tsx` 移除原有的獨立 Sound Notifications toggle
- [x] 4.2 `SettingsModal.tsx` 新增 Sound section：Enable Sound 總開關 + Waiting / Rest / Needs Approval / Idle 四個 checkbox
- [x] 4.3 `SettingsModal.tsx` 總開關 off 時，子 checkbox 視覺 disabled
- [x] 4.4 `SettingsModal.tsx` checkbox 變更時呼叫 `onSoundSettingsChange(newSettings)` → `vscode.postMessage({ type: 'setSoundSettings', settings })`
- [x] 4.5 `BottomToolbar.tsx` 透傳 `soundSettings` + `onSoundSettingsChange` props
- [x] 4.6 `App.tsx` 從 hook 取得 `soundSettings`，建立 `handleSetSoundSettings` callback，傳給 BottomToolbar

## 5. 狀態歷史記錄

- [x] 5.1 `useExtensionMessages.ts` 新增 `statusHistory: Record<number, string[]>` state
- [x] 5.2 `useExtensionMessages.ts` 新增 `pushHistory(id: number, text: string)` 輔助函數：連續去重、上限 10 筆、最新在 index 0
- [x] 5.3 `useExtensionMessages.ts` 在 `agentToolStart` handler 呼叫 `pushHistory(id, status)`
- [x] 5.4 `useExtensionMessages.ts` 在 `agentStatus` handler 呼叫 `pushHistory(id, "Waiting"/"Rest"/"Active")`
- [x] 5.5 `useExtensionMessages.ts` 在 `agentToolPermission` handler 呼叫 `pushHistory(id, "Needs approval")`
- [x] 5.6 `useExtensionMessages.ts` 在 `remotePeersUpdated` handler 中 diff 前後 snapshot，為變化的遠端 agent 呼叫 `pushHistory`
- [x] 5.7 `useExtensionMessages.ts` 在 `ExtensionMessageState` interface 和 return 中匯出 `statusHistory`

## 6. StatusHistoryPopup 元件

- [x] 6.1 新建 `src/renderer/src/components/StatusHistoryPopup.tsx`：props 為 `agentId, agentLabel, history, position, fontScale, onClose`
- [x] 6.2 Popup 以 pixel art 風格渲染：header 含 agent label + ✕ 按鈕，body 列出歷史清單
- [x] 6.3 Popup 加入 document click listener，點擊外部關閉（stopPropagation 防止立即觸發）

## 7. App 層 Popup 管理

- [x] 7.1 `App.tsx` 新增 `historyPopup` state（`{ agentId, label, position } | null`）
- [x] 7.2 `App.tsx` 新增 `handleAgentClick(agentId, label, position)` callback 設定 popup state
- [x] 7.3 `App.tsx` 新增 `handleClosePopup` callback
- [x] 7.4 `App.tsx` 渲染 `StatusHistoryPopup`（當 `historyPopup !== null`）

## 8. 各 View 點擊整合

- [x] 8.1 `DashboardView.tsx` 將 `onClickAgent` prop 改為 `onAgentClick(id, label, event)`，本機和遠端 agent card 均觸發
- [x] 8.2 `AgentListPanel.tsx` 新增 `onAgentClick` prop，agent row 加 `onClick` handler
- [x] 8.3 `AgentLabels.tsx`（Office view）將 hover area 的 click 改為觸發 `onAgentClick`
- [x] 8.4 `App.tsx` 將各 view 的 `onAgentClick` 接到 `handleAgentClick`，從 event 取 position

## 9. 驗證

- [x] 9.1 TypeScript type check 通過（main、preload、renderer）
