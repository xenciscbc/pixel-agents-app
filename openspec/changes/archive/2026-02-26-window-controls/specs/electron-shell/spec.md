## MODIFIED Requirements

### Requirement: 啟動參數解析 (modified)
Electron main process SHALL 解析 `-min` 啟動參數，控制是否建立視窗。

#### Scenario: 正常啟動
- **WHEN** 無 `-min` 參數
- **THEN** 建立主視窗（現有行為），同時建立 tray icon

#### Scenario: -min 啟動
- **WHEN** 含 `-min` 參數
- **THEN** 不建立視窗，建立 tray icon，AgentController 正常初始化

---

### Requirement: 視窗關閉行為 (modified)
window-all-closed 事件的處理 SHALL 根據是否有 tray 常駐來決定是否退出。Tray 在所有模式下都存在，因此關閉視窗永遠不會退出應用。

#### Scenario: 一般模式關閉視窗
- **WHEN** 非 `-min` 模式且所有視窗關閉
- **THEN** 應用程式不退出，tray icon 常駐，可透過 tray "Show Window" 恢復視窗

#### Scenario: -min 模式關閉視窗
- **WHEN** `-min` 模式且所有視窗關閉
- **THEN** 應用程式不退出，tray icon 常駐（無 Show Window 選項）

#### Scenario: 退出應用程式
- **WHEN** 使用者透過 tray "Exit" 選項
- **THEN** 應用程式完全退出
