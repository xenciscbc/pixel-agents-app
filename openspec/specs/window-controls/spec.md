# window-controls Specification

## Purpose

視窗管理功能：Always-on-top 置頂、System Tray 常駐、`-min` 啟動參數。

## Requirements

### Requirement: Always-on-top 視窗置頂
系統 SHALL 支援視窗置頂功能，持久化至 settings。

#### Scenario: 啟用置頂
- **WHEN** 使用者在 Settings 中啟用 Always-on-top
- **THEN** 視窗立即置頂，設定保存至 disk

#### Scenario: 啟動時載入置頂設定
- **WHEN** 應用程式啟動且 alwaysOnTop 設定為 true
- **THEN** 視窗建立後自動套用置頂

#### Scenario: 停用置頂
- **WHEN** 使用者在 Settings 中停用 Always-on-top
- **THEN** 視窗立即取消置頂，設定保存至 disk

---

### Requirement: System Tray
系統 SHALL 在 system tray 顯示應用程式圖示，提供基本操作選單。

#### Scenario: Tray icon 顯示
- **WHEN** 應用程式啟動
- **THEN** system tray 顯示應用程式圖示

#### Scenario: Tray 右鍵選單
- **WHEN** 使用者右鍵點擊 tray icon
- **THEN** 顯示選單含 "Show Window" 和 "Exit"

#### Scenario: Show Window
- **WHEN** 使用者點擊 "Show Window"
- **THEN** 主視窗顯示並取得焦點；若視窗不存在則建立

#### Scenario: Exit
- **WHEN** 使用者點擊 "Exit"
- **THEN** 應用程式完全退出

---

### Requirement: `-min` 常駐模式
系統 SHALL 支援 `-min` 啟動參數，啟動後僅顯示 tray icon 不建立視窗。

#### Scenario: -min 啟動
- **WHEN** 應用程式以 `-min` 參數啟動
- **THEN** 不建立視窗，只顯示 tray icon，SessionWatcher 和 AgentController 正常運作

#### Scenario: -min 模式下開啟視窗
- **WHEN** 使用者透過 tray "Show Window" 操作
- **THEN** 建立並顯示主視窗

#### Scenario: -min 模式關閉視窗
- **WHEN** `-min` 模式下使用者關閉視窗
- **THEN** 應用程式不退出，繼續在 tray 常駐
