# ipc-bridge Specification

## Purpose

TBD - created by archiving change 'pixel-agents-standalone'. Update Purpose after archive.

## Requirements

### Requirement: Renderer-to-main message passing
系統應提供 `window.electronAPI.send(type, payload)` 函式，以取代 `acquireVsCodeApi().postMessage()`。此函式應支援所有現有的訊息類型：`webviewReady`、`openClaude`、`focusAgent`、`closeAgent`、`saveAgentSeats`、`saveLayout`、`setSoundEnabled`、`openSessionsFolder`、`exportLayout`、`importLayout`。

#### Scenario: webviewReady message
- **WHEN** React app 掛載並送出 `{ type: 'webviewReady' }`
- **THEN** main process 觸發 agent 還原、資源載入，並傳送 layout

#### Scenario: openClaude message
- **WHEN** renderer 送出 `{ type: 'openClaude' }`
- **THEN** main process 產生一個新的 Claude CLI process 並建立一個 agent

---
### Requirement: Main-to-renderer message passing
系統應使用 `webContents.send()` 從 main 傳送訊息至 renderer。renderer 應透過 `window.electronAPI.on(channel, callback)` 接收訊息。所有現有訊息類型應被保留：`agentCreated`、`agentClosed`、`agentToolStart`、`agentToolDone`、`agentToolsClear`、`agentSelected`、`agentStatus`、`agentToolPermission`、`agentToolPermissionClear`、`layoutLoaded`、`existingAgents`、`settingsLoaded`、`characterSpritesLoaded`、`floorTilesLoaded`、`wallTilesLoaded`、`furnitureAssetsLoaded`、`subagentToolStart`、`subagentToolDone`、`subagentClear`、`subagentToolPermission`。

#### Scenario: Agent state updates
- **WHEN** main process 從 JSONL 解析中偵測到 tool start 事件
- **THEN** 將 `agentToolStart` 訊息以與原始 extension 相同的 payload 格式傳送至 renderer

---
### Requirement: Drop-in vscodeApi replacement
系統應提供一個替換模組，用於取代 `webview-ui/src/vscodeApi.ts`，並匯出具有相同 `postMessage(msg)` 介面的物件，內部使用 `window.electronAPI.send()`。

#### Scenario: Minimal webview code change
- **WHEN** vscodeApi 模組被替換
- **THEN** 所有從 `vscodeApi.ts` 匯入 `vscode` 的現有程式碼無需進一步修改即可運作

---
### Requirement: Message listener registration
renderer 的訊息監聽器應使用 `window.electronAPI.on('message', callback)`，而非 `window.addEventListener('message', handler)`。callback 應接收與 VSCode 的 `MessageEvent.data` 相同格式的資料。

#### Scenario: useExtensionMessages hook compatibility
- **WHEN** useExtensionMessages hook 註冊其事件監聯器
- **THEN** 接收的訊息格式與 VSCode 版本相同，並以相同方式處理

---

### Requirement: remotePeers IPC 訊息
IPC bridge SHALL 支援 `remotePeersUpdated` 訊息從 main process 推送遠端 peer 資料至 renderer。

#### Scenario: remotePeersUpdated 訊息格式
- **WHEN** main process 發送 remotePeersUpdated
- **THEN** 訊息包含 `{ type: 'remotePeersUpdated', peers: RemotePeer[] }`

#### Scenario: Peers 為空
- **WHEN** 所有 remote peers 離線
- **THEN** 發送 `{ type: 'remotePeersUpdated', peers: [] }`
