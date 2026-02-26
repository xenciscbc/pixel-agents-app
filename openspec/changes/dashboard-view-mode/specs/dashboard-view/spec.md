## ADDED Requirements

### Requirement: Dashboard 文字儀表板模式
系統 SHALL 提供以文字卡片為主的儀表板模式，在此模式下隱藏 canvas 辦公室圖形，改為置中最大化的 agent 監控儀表板。

#### Scenario: 切換至 dashboard 模式
- **WHEN** 使用者將 viewMode 切換為 dashboard
- **THEN** canvas、zoom 控制、ToolOverlay、AgentLabels、AgentListPanel 全部隱藏，DashboardView 元件顯示並佔據主要視窗空間

#### Scenario: Dashboard 無 agent 時
- **WHEN** dashboard 模式下沒有任何 agent
- **THEN** 顯示空狀態提示文字（如 "No active agents"）

---

### Requirement: Agent 卡片顯示豐富資訊
DashboardView 中每個 agent SHALL 以卡片形式顯示，包含 label、狀態、當前工具、sub-agent 清單、最後活動時間。

#### Scenario: Active agent 卡片內容
- **WHEN** agent 處於 Active 狀態且正在執行工具
- **THEN** 卡片顯示：agent label、● Active 狀態（藍色）、當前工具狀態文字、最後活動時間

#### Scenario: 卡片顯示 sub-agent
- **WHEN** agent 有一個或多個 sub-agent 正在執行
- **THEN** 卡片顯示 "Sub-agents: N" 及每個 sub-agent 的 label 和工具狀態，以縮排方式呈現

#### Scenario: 最後活動時間顯示
- **WHEN** agent 的最後活動時間距今 2 分鐘
- **THEN** 卡片顯示 "Last: 2m ago"

#### Scenario: 最後活動時間為剛剛
- **WHEN** agent 的最後活動時間距今小於 30 秒
- **THEN** 卡片顯示 "Last: just now"

---

### Requirement: Dashboard 按 project 分組
DashboardView SHALL 將 agent 卡片按 project 目錄分組，每組有 project 名稱 header。

#### Scenario: 多 project 分組顯示
- **WHEN** 有來自 tt-info 和 cbc-go 兩個 project 的 agents
- **THEN** 卡片按 project 分組，每組上方顯示 project 名稱 header

#### Scenario: 單一 project
- **WHEN** 所有 agent 屬於同一個 project
- **THEN** 只顯示一個 project group

---

### Requirement: Grid layout 模式
DashboardView SHALL 支援 grid layout，agent 卡片以多欄並排方式顯示，自動依視窗寬度 reflow。

#### Scenario: Grid layout 顯示
- **WHEN** dashboardLayout 為 grid
- **THEN** 卡片以 CSS Grid auto-fill 排列，每張卡片有最小寬度，視窗縮小時自動減少欄數

---

### Requirement: List layout 模式
DashboardView SHALL 支援 list layout，每個 agent 卡片獨佔一行，以水平展開的寬卡片呈現。

#### Scenario: List layout 顯示
- **WHEN** dashboardLayout 為 list
- **THEN** 卡片以單欄垂直排列，每張卡片佔滿可用寬度

---

### Requirement: lastActivity 追蹤
系統 SHALL 在每次收到 agent 相關的 IPC 訊息時更新該 agent 的 `lastActivity` timestamp。

#### Scenario: 工具啟動更新 lastActivity
- **WHEN** 收到 agentToolStart 訊息
- **THEN** 對應 agent 的 lastActivity 更新為 Date.now()

#### Scenario: 狀態變更更新 lastActivity
- **WHEN** 收到 agentStatus 訊息
- **THEN** 對應 agent 的 lastActivity 更新為 Date.now()

#### Scenario: 定期刷新相對時間顯示
- **WHEN** dashboard 可見
- **THEN** 每 30 秒重新計算並更新所有卡片的相對時間文字
