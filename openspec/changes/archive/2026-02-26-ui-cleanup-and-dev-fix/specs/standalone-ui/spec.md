## REMOVED Requirements

### Requirement: Add Agent button in BottomToolbar
**Reason**: Watch mode 架構下 agent 由系統自動偵測，手動新增功能已無用途
**Migration**: 無需遷移，功能直接移除

#### Scenario: BottomToolbar without Add Agent button
- **WHEN** 應用程式載入 BottomToolbar
- **THEN** 不顯示 "+ Agent" 按鈕，相關 `onOpenClaude` prop 鏈完全移除

---

### Requirement: Open Sessions Folder in Settings
**Reason**: Sessions folder 為內部實作細節，不適合暴露給使用者
**Migration**: 無需遷移，功能直接移除

#### Scenario: Settings without Open Sessions Folder
- **WHEN** 使用者開啟 Settings modal
- **THEN** 不顯示 "Open Sessions Folder" 按鈕，相關 IPC handler 移除
