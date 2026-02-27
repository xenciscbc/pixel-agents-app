# settings-ui Specification

## Purpose

Settings Modal 中的監控目錄管理介面與活躍閾值設定。

## Requirements

### Requirement: 監控目錄管理 UI
Settings Modal 須提供監控目錄的管理介面，包含目錄清單顯示、新增及移除功能。

#### Scenario: 顯示目錄清單
- **WHEN** 使用者開啟 Settings Modal
- **THEN** 顯示 "Watch Directories" section，列出所有已設定的監控目錄及其類型

#### Scenario: 新增 Claude Root 目錄
- **WHEN** 使用者點擊 "Add Claude Root" 按鈕
- **THEN** 自動新增 `~/.claude/projects` 為 `claude-root` 類型的監控目錄

#### Scenario: 新增單一專案目錄
- **WHEN** 使用者點擊 "Add Project" 按鈕
- **THEN** 彈出 Electron 目錄選擇 dialog，選擇後新增為 `project` 類型的監控目錄

#### Scenario: 移除監控目錄
- **WHEN** 使用者點擊目錄項目旁的刪除按鈕
- **THEN** 該目錄從清單移除，對應的觀察 agents 隨之清理

---

### Requirement: 活躍閾值設定
Settings Modal 須提供活躍閾值的數字輸入欄位。

#### Scenario: 修改閾值
- **WHEN** 使用者將 Active Threshold 從 30 改為 60
- **THEN** 設定即時生效，系統使用新閾值判定活躍 sessions

#### Scenario: 顯示預設值
- **WHEN** 使用者從未修改閾值
- **THEN** 欄位顯示預設值 30（分鐘）

---

### Requirement: 設定即時生效
Settings Modal 中的所有設定變更須即時生效並自動持久化。

#### Scenario: 新增目錄後立即掃描
- **WHEN** 使用者新增監控目錄
- **THEN** 系統立即掃描該目錄並顯示發現的活躍 agents，無需重啟 app

#### Scenario: 設定持久化
- **WHEN** 使用者修改任何設定
- **THEN** 變更自動儲存至 settings.json，下次啟動時自動載入

---

### Requirement: BottomToolbar toggle 按鈕樣式
BottomToolbar 的 toggle 按鈕組 SHALL 採用 pixel art 風格，與現有按鈕視覺一致。

#### Scenario: Toggle 按鈕外觀
- **WHEN** BottomToolbar 渲染
- **THEN** toggle 按鈕使用與 Layout/Settings 按鈕相同的 pixel art 風格（`--pixel-btn-bg`, `--pixel-accent` 等 CSS 變數）

#### Scenario: 選中狀態視覺
- **WHEN** office 模式被選中
- **THEN** office toggle 按鈕顯示 active 狀態（使用 `--pixel-active-bg` 和 `--pixel-accent` border）

---

### Requirement: SettingsModal 新增 Window section
SettingsModal SHALL 新增 Window section，包含 Always-on-top toggle。

#### Scenario: Always-on-top toggle
- **WHEN** SettingsModal 開啟
- **THEN** 顯示 "Always on Top" toggle，反映當前設定值

---

### Requirement: SettingsModal 新增 Network section
SettingsModal SHALL 新增 Network section，包含 Peer Name、Broadcast toggle、UDP Port。

#### Scenario: Peer Name input
- **WHEN** SettingsModal 開啟
- **THEN** 顯示 "Peer Name" text input，預設為電腦 hostname

#### Scenario: Broadcast toggle
- **WHEN** SettingsModal 開啟
- **THEN** 顯示 "Broadcast" toggle，預設為 enabled

#### Scenario: UDP Port input
- **WHEN** SettingsModal 開啟
- **THEN** 顯示 "UDP Port" number input，預設為 47800

---

### Requirement: SettingsModal Network section 新增 Heartbeat Interval
SettingsModal 的 Network section SHALL 新增 Heartbeat Interval 數字輸入欄位。

#### Scenario: Heartbeat Interval input
- **WHEN** SettingsModal 開啟
- **THEN** Network section 顯示 "Heartbeat Interval" number input（單位：秒），預設值為 scanIntervalSeconds

---

### Requirement: SettingsModal Sound section 細項設定
SettingsModal SHALL 新增 Sound section，提供總開關及各事件類型的獨立音效開關。原有的獨立 Sound Notifications toggle 已移入此 section 作為總開關。

#### Scenario: Sound section 結構
- **WHEN** SettingsModal 開啟
- **THEN** 顯示 Sound section，第一項為 "Enable Sound" 總開關，下方為各事件類型 checkbox

#### Scenario: 事件類型 checkbox
- **WHEN** Sound section 展開
- **THEN** 顯示 Waiting、Rest、Needs Approval、Idle 四個 checkbox，Idle 預設 off，其餘預設 on

#### Scenario: 總開關 off
- **WHEN** Enable Sound 關閉
- **THEN** 所有事件 checkbox 視覺上 disabled（greyed out），不觸發任何音效

#### Scenario: 設定即時生效
- **WHEN** 使用者切換任何 sound checkbox
- **THEN** 變更即時生效並持久化至 disk
