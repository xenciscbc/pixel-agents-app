## Why

Standalone app 的開發體驗和 UI 存在四個需要修正的問題：dev script 關閉後子進程殘留（Windows 環境）、AgentListPanel 拖動位置未持久化且預設位置不理想、+Agent 按鈕在 watch mode 架構下已無用途、Settings 中 Open Sessions Folder 功能已不適用。

## What Changes

- **Fix**: `scripts/dev.mjs` 在 Windows 上因 `shell: true` 導致 `.kill()` 只殺掉 cmd.exe shell 而非實際子進程，需改用 process tree 終止
- **Enhancement**: AgentListPanel 預設位置改為右上角，拖動後的位置透過 settingsStore 持久化，下次啟動時恢復
- **Remove**: 左下角 BottomToolbar 中的 `+ Agent` 按鈕及相關 `onOpenClaude` 調用鏈
- **Remove**: SettingsModal 中的 `Open Sessions Folder` 按鈕及 main process 中對應的 IPC handler

## Capabilities

### New Capabilities

- `panel-position-persistence`: AgentListPanel 的位置持久化與預設右上角定位

### Modified Capabilities

- `standalone-ui`: 移除 +Agent 按鈕和 Open Sessions Folder 功能
- `electron-shell`: 修正 dev script 的進程清理邏輯

## Impact

- `scripts/dev.mjs` — 進程終止邏輯
- `src/renderer/src/components/AgentListPanel.tsx` — 位置狀態管理
- `src/renderer/src/components/BottomToolbar.tsx` — 移除 +Agent 按鈕
- `src/renderer/src/components/SettingsModal.tsx` — 移除 Open Sessions Folder
- `src/main/agentController.ts` — IPC handler 清理、panel 位置存取
- `src/main/settingsStore.ts` — 新增 panel position setting
- `src/renderer/src/App.tsx` — 清理 onOpenClaude prop 鏈
