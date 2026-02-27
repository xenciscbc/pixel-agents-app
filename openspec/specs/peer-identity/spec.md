# peer-identity Specification

## Purpose

LAN peer sharing 的身份與網路設定基礎：peer 名稱、廣播開關、UDP port。

## Requirements

### Requirement: Peer 名稱設定
系統 SHALL 提供 `peerName` 設定，預設為電腦 hostname，持久化至 settings。

#### Scenario: 預設名稱
- **WHEN** peerName 未設定
- **THEN** 使用 `os.hostname()` 作為預設值

#### Scenario: 自訂名稱
- **WHEN** 使用者在 Settings 中修改 Peer Name
- **THEN** 新名稱保存至 disk 並即時生效

---

### Requirement: 廣播開關
系統 SHALL 提供 `broadcastEnabled` 設定（預設 true），控制是否對外廣播 agent 狀態。

#### Scenario: 啟用廣播
- **WHEN** broadcastEnabled 為 true
- **THEN** 區網共享功能（由 lan-peer-sharing 實作）允許廣播

#### Scenario: 停用廣播
- **WHEN** 使用者在 Settings 中停用 Broadcast
- **THEN** 設定保存，區網共享不廣播本機狀態

---

### Requirement: UDP Port 設定
系統 SHALL 提供 `udpPort` 設定（預設 47800），供區網共享使用。

#### Scenario: 預設 port
- **WHEN** udpPort 未設定
- **THEN** 使用預設值 47800

#### Scenario: 自訂 port
- **WHEN** 使用者在 Settings 中修改 UDP Port
- **THEN** 新 port 保存至 disk

---

### Requirement: Heartbeat 間隔設定
系統 SHALL 提供 `heartbeatInterval` 設定（單位：秒），控制 UDP heartbeat 發送頻率。預設值等於 `scanIntervalSeconds`（預設 30 秒）。

#### Scenario: 預設值
- **WHEN** heartbeatInterval 未設定
- **THEN** 使用 `scanIntervalSeconds` 的值作為預設（預設 30 秒）

#### Scenario: 自訂間隔
- **WHEN** 使用者在 Settings 中修改 Heartbeat Interval
- **THEN** 新間隔保存至 disk，broadcast 以新間隔重新啟動
