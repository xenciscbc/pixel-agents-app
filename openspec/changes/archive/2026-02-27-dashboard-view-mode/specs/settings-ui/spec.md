## MODIFIED Requirements

### Requirement: SettingsModal 新增 Network section (modified)
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

## ADDED Requirements

### Requirement: SettingsModal Sound section 細項設定
SettingsModal SHALL 新增 Sound section，提供總開關及各事件類型的獨立音效開關。

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

## REMOVED Requirements

### Requirement: Sound Notifications toggle (原位置)
**Reason**: Sound toggle 從 SettingsModal 的獨立位置移入新的 Sound section 作為總開關
**Migration**: 功能保留，位置移至 Sound section 第一項 "Enable Sound"
