## 1. Data Layer & Persistence

- [x] 1.1 在 settingsStore.ts 新增 viewMode、dashboardLayout、agentListPanelSize 的 getter/setter
- [x] 1.2 在 agentController.ts handleMessage 新增 setViewMode、setDashboardLayout、getViewModeSettings、setAgentListPanelSize、getAgentListPanelSize 的 IPC 處理
- [x] 1.3 在 handleWebviewReady 中將 viewMode、dashboardLayout、panelSize 一併傳送給 renderer
- [x] 1.4 在 useExtensionMessages 的 AgentMeta 介面新增 lastActivity 欄位，每次收到 agent 相關 IPC 訊息時更新 Date.now()

## 2. AgentListPanel 增強

- [x] 2.1 將 subagentCharacters 和 subagentTools 傳入 AgentListPanel（修改 App.tsx 和 AgentListPanelProps）
- [x] 2.2 在 AgentListPanel 中顯示 sub-agent：父 agent 下方以縮排方式顯示 sub-agent label 和工具狀態
- [x] 2.3 實作 AgentListPanel resize handle（右邊緣和底邊拖曳），新增 size state
- [x] 2.4 mount 時從 main process 載入 panelSize，resize 結束時持久化

## 3. BottomToolbar 改造

- [x] 3.1 新增 viewMode toggle 按鈕（Office/Dashboard），使用 pixel art 風格，active 狀態高亮
- [x] 3.2 新增 dashboardLayout toggle 按鈕（Grid/List），僅在 dashboard 模式下顯示
- [x] 3.3 在 dashboard 模式下隱藏 Layout 按鈕
- [x] 3.4 切換 viewMode/dashboardLayout 時透過 callback 通知 App.tsx 並發送 IPC 持久化

## 4. DashboardView 元件

- [x] 4.1 建立 DashboardView.tsx 元件骨架，接收 agents、agentMetas、agentStatuses、agentTools、subagentCharacters、subagentTools、dashboardLayout props
- [x] 4.2 實作 project 分組邏輯（複用 projectDisplayName），每組有 project header
- [x] 4.3 實作 agent 卡片：顯示 label、狀態 dot + 文字、當前工具狀態、sub-agent 清單、lastActivity 相對時間
- [x] 4.4 實作 grid layout（CSS Grid auto-fill，自動 reflow）
- [x] 4.5 實作 list layout（單欄垂直排列，卡片佔滿寬度）
- [x] 4.6 實作相對時間顯示（just now / Nm ago / Nh ago）及 30 秒 setInterval 刷新
- [x] 4.7 無 agent 時顯示空狀態提示

## 5. App.tsx 整合

- [x] 5.1 新增 viewMode 和 dashboardLayout state，mount 時從 IPC 載入
- [x] 5.2 根據 viewMode 條件渲染：office 模式顯示 canvas 相關元件，dashboard 模式顯示 DashboardView
- [x] 5.3 將 viewMode 和 dashboardLayout 傳遞給 BottomToolbar 和 DashboardView
- [x] 5.4 將 subagentCharacters 和 subagentTools 傳遞給 DashboardView

## 6. 驗證

- [x] 6.1 Type check 通過（pnpm run check-types）
- [ ] 6.2 dev 模式下測試：office/dashboard 切換、grid/list 切換、所有偏好持久化
- [ ] 6.3 測試 AgentListPanel resize 和 sub-agent 顯示
