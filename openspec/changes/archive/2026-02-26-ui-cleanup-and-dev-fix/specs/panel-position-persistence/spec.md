## ADDED Requirements

### Requirement: AgentListPanel position defaults to top-right
AgentListPanel 首次顯示時 SHALL 定位於視窗右上角（距右邊 8px、距上方 8px）。

#### Scenario: First launch without saved position
- **WHEN** 應用程式首次啟動且無已儲存的 panel 位置
- **THEN** AgentListPanel 顯示在視窗右上角（right: 8px, top: 8px）

---

### Requirement: AgentListPanel position persistence across sessions
使用者拖動 AgentListPanel 後，系統 SHALL 將位置持久化至 settingsStore，下次啟動時 SHALL 還原至上次位置。

#### Scenario: Drag and save position
- **WHEN** 使用者拖動 AgentListPanel 並放開滑鼠
- **THEN** 新位置透過 IPC 傳送至 main process 並持久化至 settingsStore

#### Scenario: Restore saved position on launch
- **WHEN** 應用程式啟動且 settingsStore 中存在已儲存的 panel 位置
- **THEN** AgentListPanel 顯示在該儲存位置
