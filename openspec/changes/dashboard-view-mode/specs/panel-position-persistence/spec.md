## ADDED Requirements

### Requirement: AgentListPanel 可調整大小
AgentListPanel SHALL 支援透過拖曳邊緣調整寬度和高度。

#### Scenario: 拖曳右邊緣調整寬度
- **WHEN** 使用者拖曳 panel 右邊緣
- **THEN** panel 寬度隨游標位置即時更新

#### Scenario: 拖曳底邊調整高度
- **WHEN** 使用者拖曳 panel 底邊緣
- **THEN** panel 高度隨游標位置即時更新

#### Scenario: Resize cursor 提示
- **WHEN** 游標移至 panel 右邊緣或底邊附近（8px 範圍內）
- **THEN** 游標變為 resize cursor（col-resize 或 row-resize）

---

### Requirement: AgentListPanel size 持久化
AgentListPanel 的大小 SHALL 持久化至 settingsStore，下次啟動時還原。

#### Scenario: 拖曳結束後持久化
- **WHEN** 使用者完成 resize 拖曳（mouseUp）
- **THEN** 新的 { width, height } 透過 IPC 傳送至 main process 並寫入 settingsStore

#### Scenario: 啟動時還原大小
- **WHEN** 應用程式啟動且 settingsStore 中存在已儲存的 panel size
- **THEN** AgentListPanel 使用已儲存的寬高作為初始值

#### Scenario: 無已儲存大小時使用預設值
- **WHEN** settingsStore 中無 panel size 設定
- **THEN** 使用預設值 width: 220, height: 300

---

### Requirement: AgentListPanel 顯示 sub-agent
AgentListPanel SHALL 在父 agent 下方以縮排方式顯示該 agent 的 sub-agent。

#### Scenario: 有 sub-agent 時顯示
- **WHEN** Agent #1 有一個正在執行的 sub-agent
- **THEN** 在 Agent #1 行下方以縮排方式顯示 sub-agent 的 label 和工具狀態

#### Scenario: Sub-agent 完成後消失
- **WHEN** sub-agent 的 Task tool 完成
- **THEN** 對應的 sub-agent 行從 list 中移除

#### Scenario: 無 sub-agent 時不顯示額外內容
- **WHEN** agent 沒有任何 sub-agent
- **THEN** 不顯示任何 sub-agent 相關行
