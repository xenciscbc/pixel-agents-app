# font-scale Specification

## Purpose

提供全域字體縮放設定，讓使用者可依需求調整 UI 文字大小，持久化至 settings.json。

## Requirements

### Requirement: Font Scale 持久化設定
系統 SHALL 提供 `fontScale` 設定（預設 1.0），持久化至 settings.json。

#### Scenario: 啟動時載入 fontScale
- **WHEN** webview ready
- **THEN** main process 發送 `fontScaleLoaded` 訊息，包含儲存的 fontScale 值

#### Scenario: 使用者更改 fontScale
- **WHEN** renderer 發送 `setFontScale` 訊息
- **THEN** main process 保存至 disk 並回傳 `fontScaleLoaded` 確認

---

### Requirement: Font Scale UI 控件
SettingsModal SHALL 提供 range slider 讓使用者調整 fontScale。

#### Scenario: Slider 操作
- **GIVEN** SettingsModal 開啟
- **WHEN** 使用者拖動 Font Scale slider
- **THEN** 即時更新 fontScale 值（0.5x ~ 3.0x，step 0.1）
- **AND** 顯示當前值（如 "1.2x"）
- **AND** UI 字體立即反映變化

---

### Requirement: AgentListPanel 字體縮放
AgentListPanel SHALL 根據 fontScale 縮放所有 fontSize。

#### Scenario: fontScale 套用
- **WHEN** fontScale 為 1.5
- **THEN** 標題(20px) 顯示為 30px、project header(18px) 為 27px、agent label(18px) 為 27px、status(14px) 為 21px、sub-agent(14px) 為 21px

---

### Requirement: DashboardView 字體縮放
DashboardView SHALL 根據 fontScale 縮放所有 fontSize。

#### Scenario: fontScale 套用
- **WHEN** fontScale 為 2.0
- **THEN** 所有文字元素的 fontSize 為基礎值乘以 2.0

---

### Requirement: AgentLabels 字體縮放
AgentLabels tooltip SHALL 根據 fontScale 縮放 fontSize。

#### Scenario: fontScale 套用
- **WHEN** fontScale 變更
- **THEN** agent tooltip label 和 status text 的 fontSize 隨之縮放
