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
