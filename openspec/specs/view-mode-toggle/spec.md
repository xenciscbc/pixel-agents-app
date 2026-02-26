# view-mode-toggle Specification

## Purpose

BottomToolbar 中的 office/dashboard 模式切換、grid/list layout 切換，以及 viewMode 持久化。

## Requirements

### Requirement: Office/Dashboard 模式切換 toggle
BottomToolbar SHALL 包含一個 toggle 按鈕組，讓使用者在 office（圖形）和 dashboard（文字）模式間切換。

#### Scenario: 切換至 dashboard 模式
- **WHEN** 使用者點擊 toggle 的 dashboard 選項
- **THEN** viewMode 切換為 dashboard，UI 更新為儀表板模式

#### Scenario: 切換至 office 模式
- **WHEN** 使用者點擊 toggle 的 office 選項
- **THEN** viewMode 切換為 office，UI 恢復為 canvas 辦公室模式

#### Scenario: 預設為 office 模式
- **WHEN** 應用程式首次啟動且無已儲存的 viewMode
- **THEN** 預設顯示 office 模式

---

### Requirement: Grid/List layout 切換 toggle
BottomToolbar SHALL 在 dashboard 模式下顯示第二組 toggle 按鈕，讓使用者在 grid 和 list layout 間切換。

#### Scenario: Toggle 僅在 dashboard 模式可見
- **WHEN** viewMode 為 office
- **THEN** grid/list toggle 不顯示

#### Scenario: Toggle 在 dashboard 模式可見
- **WHEN** viewMode 為 dashboard
- **THEN** grid/list toggle 顯示在 BottomToolbar 中

#### Scenario: 切換 layout
- **WHEN** 使用者點擊 list 選項
- **THEN** dashboardLayout 切換為 list，卡片排列方式立即更新

---

### Requirement: Dashboard 模式下隱藏 Layout 按鈕
BottomToolbar SHALL 在 dashboard 模式下隱藏 Layout 編輯按鈕。

#### Scenario: Office 模式顯示 Layout 按鈕
- **WHEN** viewMode 為 office
- **THEN** Layout 按鈕正常顯示

#### Scenario: Dashboard 模式隱藏 Layout 按鈕
- **WHEN** viewMode 為 dashboard
- **THEN** Layout 按鈕不顯示

---

### Requirement: ViewMode 持久化
viewMode 和 dashboardLayout 的選擇 SHALL 持久化至 settingsStore，下次啟動時自動還原。

#### Scenario: 持久化 viewMode
- **WHEN** 使用者切換 viewMode
- **THEN** 新值透過 IPC 傳送至 main process 並寫入 settingsStore

#### Scenario: 啟動時還原 viewMode
- **WHEN** 應用程式啟動且 settingsStore 中存在已儲存的 viewMode
- **THEN** 使用已儲存的 viewMode 作為初始值

#### Scenario: 持久化 dashboardLayout
- **WHEN** 使用者切換 dashboardLayout
- **THEN** 新值透過 IPC 傳送至 main process 並寫入 settingsStore
