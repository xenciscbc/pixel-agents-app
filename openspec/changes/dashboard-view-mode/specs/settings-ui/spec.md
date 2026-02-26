## ADDED Requirements

### Requirement: BottomToolbar toggle 按鈕樣式
BottomToolbar 的 toggle 按鈕組 SHALL 採用 pixel art 風格，與現有按鈕視覺一致。

#### Scenario: Toggle 按鈕外觀
- **WHEN** BottomToolbar 渲染
- **THEN** toggle 按鈕使用與 Layout/Settings 按鈕相同的 pixel art 風格（`--pixel-btn-bg`, `--pixel-accent` 等 CSS 變數）

#### Scenario: 選中狀態視覺
- **WHEN** office 模式被選中
- **THEN** office toggle 按鈕顯示 active 狀態（使用 `--pixel-active-bg` 和 `--pixel-accent` border）
