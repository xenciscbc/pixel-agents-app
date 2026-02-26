## Context

Pixel Agents standalone Electron app 在 Windows 開發環境下存在進程清理問題，UI 上有幾個從 VS Code extension 時代遺留的功能需要清除，AgentListPanel 缺少位置持久化。

## Goals / Non-Goals

**Goals:**
- Dev script 關閉時完整終止所有子進程（Windows 相容）
- AgentListPanel 預設右上角，位置可拖動且跨 session 持久化
- 移除不再適用的 UI 元素（+Agent、Open Sessions Folder）

**Non-Goals:**
- 不重新設計 BottomToolbar 的 layout
- 不改動 AgentListPanel 的功能邏輯（分組、狀態顯示等）

## Decisions

### 1. Dev script 進程終止 — 使用 taskkill process tree

**選擇**: 在 Windows 上使用 `taskkill /pid <pid> /T /F`，非 Windows 用 `process.kill(-pid)`

**原因**: `shell: true` spawn 在 Windows 創建 cmd.exe 子 shell，Node.js 的 `.kill()` 只殺 shell 本身。`taskkill /T` 會遞迴終止整個 process tree。跨平台判斷 `process.platform === 'win32'`。

**替代方案**: 不用 `shell: true` — 但 pnpm 在 Windows 需要 shell 來解析 .cmd shim，改動風險較大。

### 2. Panel 位置持久化 — settingsStore + IPC

**選擇**: 透過 `settingsStore` 持久化 `agentListPanelPos`，renderer 透過 IPC 讀寫

**流程**:
1. App 啟動時 renderer 發送 `getAgentListPanelPos` 請求
2. Main process 從 settingsStore 讀取回傳
3. 拖動結束時 renderer 發送 `setAgentListPanelPos` 更新
4. 預設值：`{ x: -188, y: 8 }`（負值表示從右邊算起，即 `window.innerWidth + x`）

**替代方案**: localStorage — 但其他 settings 已統一用 settingsStore，保持一致。

### 3. 移除 +Agent — 清理整條調用鏈

移除路徑：`BottomToolbar` → `onOpenClaude` prop → `App.tsx` → `useEditorActions.handleOpenClaude`

保留 `handleOpenClaude` 在 `useEditorActions` 中（如果其他地方有用），否則一併移除。

### 4. 移除 Open Sessions Folder — renderer + main

移除 `SettingsModal.tsx` 中的按鈕，以及 `agentController.ts` 中 `openSessionsFolder` 的 IPC handler。

## Risks / Trade-offs

- **taskkill 依賴 Windows 系統命令** → 只在 `win32` 平台使用，其他平台用 POSIX signal，風險可控
- **Panel 負值定位** → 需要在 window resize 時重新計算，但因為是 absolute positioning 且用 `useEffect` 初始化一次即可，resize 場景可暫不處理
