## 1. Dev Script Process Cleanup

- [x] 1.1 修改 `scripts/dev.mjs` 的 cleanup 函數，在 Windows 上使用 `taskkill /pid <pid> /T /F` 終止 Vite 和 Electron 的 process tree
- [x] 1.2 保留非 Windows 平台的原有 `.kill()` 邏輯，加入 `process.platform === 'win32'` 判斷

## 2. Remove +Agent Button

- [x] 2.1 從 `BottomToolbar.tsx` 移除 "+ Agent" 按鈕的 JSX 和 `onOpenClaude` prop
- [x] 2.2 從 `App.tsx` 移除傳遞給 BottomToolbar 的 `onOpenClaude` prop
- [x] 2.3 若 `handleOpenClaude` 在 `useEditorActions` 中無其他使用者，一併移除

## 3. Remove Open Sessions Folder

- [x] 3.1 從 `SettingsModal.tsx` 移除 "Open Sessions Folder" 按鈕
- [x] 3.2 從 `agentController.ts` 移除 `openSessionsFolder` 的 IPC handler（已不存在，無需修改）

## 4. AgentListPanel Position Persistence

- [x] 4.1 在 `agentController.ts` 新增 `getAgentListPanelPos` 和 `setAgentListPanelPos` IPC handler，使用 settingsStore 讀寫
- [x] 4.2 修改 `AgentListPanel.tsx` 預設位置為右上角（使用 `window.innerWidth` 計算）
- [x] 4.3 在 `AgentListPanel.tsx` 啟動時透過 IPC 請求已儲存位置，收到後設定
- [x] 4.4 拖動結束（mouseup）時透過 IPC 傳送新位置至 main process 持久化
