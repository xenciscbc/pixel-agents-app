## Why

目前應用程式只有圖形辦公室模式，當 agent 數量多時，使用者需要在 canvas 上找角色才能掌握狀態。AgentListPanel 功能有限（固定大小、不顯示 sub-agent），缺乏一個以文字為主的儀表板視圖來高效監控所有 agent。同時 AgentListPanel 本身也需要可調整大小和顯示 sub-agent 資訊。

## What Changes

- 新增 **Dashboard 文字模式**：以置中最大化的卡片式儀表板取代 canvas 圖形顯示，支援 grid（並排）和 list（一列一個）兩種 layout
- 新增 **模式切換 toggle**：在 BottomToolbar 加入 office/dashboard 切換，dashboard 模式下隱藏 Layout 按鈕
- 新增 **Dashboard layout 切換 toggle**：在 BottomToolbar 加入 grid/list 切換（僅 dashboard 模式可見）
- **AgentListPanel 可調整大小**：加入 resize handle，拖曳邊緣可改變寬高
- **AgentListPanel 顯示 sub-agent**：在父 agent 下方以縮排方式顯示 sub-agent 及其工具狀態
- 新增 **Agent 卡片元件**：豐富的 agent 資訊卡片，顯示 project、狀態、當前工具、sub-agent 清單、最後活動時間
- **追蹤 lastActivity**：每次收到 JSONL 事件時更新 agent 的最後活動時間戳
- **所有 UI 偏好持久化**：viewMode、dashboardLayout、panel size 均透過 settingsStore 跨 session 保留

## Capabilities

### New Capabilities
- `dashboard-view`: 文字儀表板模式，含 grid/list layout、agent 卡片、project 分組顯示
- `view-mode-toggle`: office/dashboard 模式切換及 grid/list layout 切換的 UI 控制和持久化

### Modified Capabilities
- `panel-position-persistence`: 擴展為同時持久化 panel size（width, height），不只是 position
- `settings-ui`: 不直接修改 Settings Modal，但 BottomToolbar 需要新增 toggle 按鈕

## Impact

- **新檔案**: `DashboardView.tsx`, `AgentCard.tsx`
- **修改**: `App.tsx`（viewMode 條件渲染）, `BottomToolbar.tsx`（toggle 按鈕、Layout 隱藏）, `AgentListPanel.tsx`（resize + sub-agent）, `useExtensionMessages.ts`（lastActivity 追蹤、傳遞 subagent 資料）
- **Main process**: `agentController.ts`（持久化 viewMode/dashboardLayout/panelSize）, `settingsStore.ts`（新 keys）
- **無 breaking changes**：預設仍為 office 模式
