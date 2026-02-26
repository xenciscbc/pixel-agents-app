## Context

Pixel Agents 目前只有 canvas 辦公室圖形模式。AgentListPanel 是一個固定大小的浮動面板，顯示 agent 名稱和簡略狀態。Sub-agent 資料（`subagentCharacters`, `subagentTools`）已在 `useExtensionMessages` state 中追蹤，但未傳遞給 AgentListPanel。

現有的持久化機制透過 `settingsStore.ts` 處理，前端經由 IPC 訊息 `getXxx` / `setXxx` 與 main process 溝通。

## Goals / Non-Goals

**Goals:**
- 提供文字儀表板模式，讓使用者能在無 canvas 情況下高效監控所有 agent
- AgentListPanel 支援 resize 和 sub-agent 顯示
- 所有 UI 偏好（viewMode, dashboardLayout, panelSize）跨 session 持久化
- Dashboard 支援 grid/list 兩種 layout，按 project 分組

**Non-Goals:**
- Dashboard 不需要支援 agent 操作（如終止、重啟）
- 不需要 agent 歷史紀錄或 log 查看功能
- 不重構現有的 OfficeCanvas 或圖形引擎

## Decisions

### 1. ViewMode 狀態管理：React state + IPC 持久化

**選擇**: `viewMode` 和 `dashboardLayout` 作為 App.tsx 的 React state，mount 時從 main process 載入，變更時寫回。

**替代方案**: 放在 useExtensionMessages hook 中。但這些是純 UI 偏好，不是 extension message 狀態，放在 App.tsx 更合理。

**實作方式**:
- `webviewReady` 回應中新增 `viewMode` 和 `dashboardLayout` 欄位
- 新增 IPC 訊息: `setViewMode`, `setDashboardLayout`
- BottomToolbar 透過 callback props 觸發切換

### 2. DashboardView 元件架構

```
App.tsx
├── viewMode === 'office'
│   ├── OfficeCanvas
│   ├── ZoomControls
│   ├── ToolOverlay
│   ├── AgentLabels
│   └── AgentListPanel
└── viewMode === 'dashboard'
    └── DashboardView
        ├── Project Group Header
        └── AgentCard[] (grid 或 list)
```

**選擇**: DashboardView 是獨立元件，不復用 AgentListPanel。

**理由**: 兩者的 layout 和資訊密度完全不同。AgentListPanel 是輕量浮動面板，DashboardView 是全螢幕儀表板。共用 `AgentCard` 元件不實際，因為 list panel 的每行是緊湊的一行式，而 dashboard 卡片是多行區塊。

### 3. AgentListPanel resize：邊緣拖曳

**選擇**: 右邊緣和底邊拖曳 resize（類似 window resize）。

**實作**:
- 在 panel 右邊緣和底邊加入 8px 的 invisible hit area
- 拖曳時更新 width/height state
- mouseUp 時持久化 `{ width, height }` 到 settingsStore
- 複用現有的 `agentListPanelPos` IPC pattern，新增 `agentListPanelSize` key

### 4. Sub-agent 在 AgentListPanel 中的顯示

**選擇**: 在父 agent 行下方以縮排顯示 sub-agent，展示 label 和工具狀態。

**資料來源**: 需要將 `subagentCharacters` 和 `subagentTools` 傳入 AgentListPanel。

```
● Agent #1      Reading file.ts
  └ ● Subtask   Searching code
● Agent #2      Idle
```

### 5. lastActivity 追蹤

**選擇**: 在 `AgentMeta` 介面新增 `lastActivity?: number`（Date.now() timestamp），在 `useExtensionMessages` 中每次處理該 agent 的任何 IPC 訊息時更新。

**顯示格式**: 相對時間（"just now", "2m ago", "1h ago"）。用簡單的 `setInterval` 每 30 秒重新 render 一次以更新顯示。

### 6. BottomToolbar toggle 按鈕設計

**選擇**: 使用兩組 toggle 按鈕，pixel art 風格的文字按鈕。

```
[Office|Dashboard]  [Grid|List]  Layout  Settings
                     ↑ 僅 dashboard 模式可見
                                  ↑ 僅 office 模式可見
```

用 icon-like 短文字而非真正的 SVG icon，與現有 pixel art UI 風格一致。

### 7. Dashboard 卡片內容

每張 AgentCard 顯示：
- Agent label（如 "Agent #1"）
- 狀態 dot + 狀態文字（Active/Waiting/Needs Approval/Idle）
- 當前工具狀態（如 "Reading file.ts"）
- Sub-agent 數量及清單（縮排顯示）
- 最後活動時間（相對時間）

按 project 分組，每組有 project name header。

## Risks / Trade-offs

- **[Canvas 停止更新]** Dashboard 模式下 canvas 仍在 DOM 但隱藏（`display: none`）→ requestAnimationFrame 應在 hidden 時自動暫停，無額外成本。若確實有效能問題，可在切換時 unmount canvas。
- **[過多 agent 時的 dashboard 效能]** Grid layout 中大量卡片 → 使用原生 CSS Grid `auto-fill`，瀏覽器本身即能高效處理數百個 DOM 元素。暫不需要虛擬化。
- **[Resize 體驗]** 純 CSS cursor + mouseMove 的 resize 在 pixel art 風格下可能不夠直覺 → 保持簡單，resize handle 用不同 cursor 提示即可。
