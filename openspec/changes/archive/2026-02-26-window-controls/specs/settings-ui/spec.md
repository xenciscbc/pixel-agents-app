## MODIFIED Requirements

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
