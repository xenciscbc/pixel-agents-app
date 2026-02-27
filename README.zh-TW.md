# Pixel Agents — 獨立 Electron 應用程式

一個獨立的 Electron 桌面應用程式，將你的 Claude Code agents 以像素風格動畫角色呈現在虛擬辦公室中。

本專案是從原始 VS Code 擴充套件 **[Pixel Agents](https://github.com/pablodelucca/pixel-agents)**（作者：**[Pablo De Lucca](https://github.com/pablodelucca)**）分離出來的**獨立版本**。

## 來源

- **原始專案**: [pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents)
- **原始作者**: Pablo De Lucca
- **原始授權**: MIT
- **VS Code Marketplace**: [Pixel Agents](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents)

原始專案是 VS Code 擴充套件。本獨立版本作為獨立的 Electron 應用程式運行，不依賴 VS Code，並新增了多專案 session 監控等功能。

## 與原版差異

相較於原始 VS Code 擴充套件，本獨立版本新增：

- **獨立 Electron 應用程式** — 不需要安裝 VS Code
- **Watch 模式** — 自動從 `~/.claude/projects` 發現並監控活躍的 Claude Code sessions
- **多專案支援** — 同時觀察多個專案目錄中的 agents
- **觀察模式** — 被動監控現有的 Claude Code sessions，不會啟動或終止任何程序
- **設定介面** — 內建設定面板，可配置監控目錄、活躍閾值和掃描間隔
- **Agent 清單面板** — 可拖曳的側邊面板，按專案分組顯示 agents 和即時狀態
- **可設定開發埠** — 跨平台開發腳本，使用設定中的 port 配置

## 功能特色

- **一個 agent 一個角色** — 每個 Claude Code session 都有自己的動畫角色
- **即時活動追蹤** — 角色動畫根據 agent 實際操作即時更新
- **辦公室佈局編輯器** — 用地板、牆壁和家具設計你的辦公室
- **對話氣泡** — agent 等待中或需要許可時的視覺提示
- **音效通知** — 細項可控的事件音效（詳見[音效通知](#音效通知)）
- **Sub-agent 視覺化** — Task tool 的 sub-agents 會生成獨立角色
- **佈局持久化** — 辦公室設計跨 session 保存
- **三種檢視模式** — Office（像素風）、Dashboard（卡片式）、List（精簡面板）
- **區域網路共享** — 查看同一網路上其他機器的 agents
- **狀態歷史** — 點擊任意 agent 查看近期活動歷史
- **視窗控制** — 置頂、系統匣、最小化至系統匣

## 檢視模式

使用底部工具列切換三種檢視模式：

| 模式 | 說明 |
|---|---|
| **Office** | 像素風格動畫辦公室，角色走動和打字。將滑鼠移到角色上可查看名稱和狀態。 |
| **Dashboard** | 卡片式 grid/list 檢視。每張卡片顯示 agent 名稱、狀態、當前工具、sub-agents 和最後活動時間。支援 grid 和 list 兩種佈局。 |
| **List** | 精簡的可拖曳/可調整大小側邊面板，按專案分組顯示所有 agents。 |

在所有三種檢視中，**點擊 agent** 可開啟彈出視窗，顯示最近 10 筆狀態事件（連續去重）。

## Agent 狀態偵測

Agent 狀態透過持續讀取 Claude Code 在每個 session 中寫入的 JSONL transcript 檔案來判定。解析器（[transcriptParser.ts](src/main/transcriptParser.ts)）讀取每一行新資料並更新 agent 狀態：

| 狀態 | 條件 | 視覺表現 |
|---|---|---|
| **Active** | Agent 正在輸出文字或執行工具 | 角色打字動畫 |
| **Waiting** | 收到 `turn_duration` 系統記錄（回合結束），或 agent 僅輸出文字且 5 秒無工具呼叫（`TEXT_IDLE_DELAY_MS`） | 對話氣泡顯示 "waiting" |
| **Needs Approval** | 工具執行超過 7 秒（`PERMISSION_TIMER_DELAY_MS`）未完成，且不在豁免清單中（`Task`、`AskUserQuestion`） | 紅色閃爍圓點 + 對話氣泡 |
| **Rest** | Agent 被 API 限流 | 紅色 "Rest" 指示器 |
| **Idle** | 無近期 JSONL 活動；session 可能已結束 | 灰色狀態圓點 |

### 音效通知

音效通知使用兩音升調提示音（E5 → E6）。每種事件類型可在 **Settings > Sound** 中獨立啟用或停用：

| 事件 | 預設 | 播放時機 |
|---|---|---|
| **Enable Sound** | 開啟 | 總開關 — 關閉時停用所有音效 |
| **Waiting** | 開啟 | Agent 完成回合，等待使用者輸入 |
| **Rest** | 開啟 | Agent 觸發 API 限流 |
| **Needs Approval** | 開啟 | 工具等待使用者許可 |
| **Idle** | 關閉 | Agent 進入閒置狀態（所有工具已完成，無進行中工作） |

當總開關 "Enable Sound" 關閉時，所有子選項會視覺上變為停用狀態，無論個別設定如何都不會播放音效。

## 區域網路共享

查看同一區域網路上其他運行 Pixel Agents 的機器上的 agents。這是**唯讀的** — 你可以觀察遠端 agents 但無法控制它們。

### 運作方式

1. 每個實例透過 UDP 在區域網路上廣播自己的 agent 狀態
2. 同一子網路上的其他實例發現並顯示遠端 agents
3. 遠端 agents 會在所有三種檢視模式中顯示，帶有 peer 名稱前綴

### 設定（Settings > Network）

| 設定 | 預設值 | 說明 |
|---|---|---|
| **Peer Name** | 電腦主機名稱 | 顯示給其他 peers 的名稱 |
| **Broadcast** | 啟用 | 開關廣播功能 |
| **UDP Port** | 47800 | peer 發現使用的埠號（所有 peers 必須一致） |
| **Heartbeat Interval** | 30 秒 | 廣播 agent 狀態的頻率 |

> **注意**：所有 peers 必須使用相同的 UDP port 才能互相看到。遠端 agent 的歷史精度受限於 heartbeat 間隔 — 兩次心跳之間的狀態變化不會被捕捉。

## 設定

從底部工具列的齒輪圖示開啟設定。可用的設定區塊：

### Watch Directories（監控目錄）
- **Add Claude Root** — 監控 `~/.claude/projects` 下的所有活躍 sessions
- **Add Project** — 監控特定專案目錄
- **Active Threshold** — session 閒置多久後視為過期（預設：30 分鐘）

### Window（視窗）
- **Always on Top** — 視窗置頂顯示

### Network（網路）
- Peer Name、Broadcast 開關、UDP Port、Heartbeat Interval（詳見[區域網路共享](#區域網路共享)）

### Sound（音效）
- 總開關 + 各事件獨立控制（詳見[音效通知](#音效通知)）

### Display（顯示）
- **Font Scale** — 調整 UI 文字大小，範圍 0.5x 至 3.0x（影響所有檢視模式）

## 系統需求

- Node.js 18+
- [pnpm](https://pnpm.io/)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 已安裝並設定完成

## 快速開始

```bash
pnpm install
pnpm run dev
```

## 建置與打包

建置全部（main + preload + renderer）：

```bash
pnpm run build
```

打包為可攜式執行檔（無需安裝）：

```bash
# Windows + Mac
pnpm run package

# 僅 Windows — 輸出 release/Pixel Agents *.exe（可攜式）
pnpm package:win

# 僅 Mac — 輸出 release/Pixel Agents *.dmg
pnpm package:mac
```

> **注意**：跨平台打包有限制 — 建置 Mac 套件需要在 macOS 上執行（或使用有 macOS runner 的 CI）。Windows 可攜式 `.exe` 只能在 Windows 上建置。

## 辦公室素材

本專案使用的辦公室素材為 **Donarg** 的 **[Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset)**。素材授權詳情請參閱[原始專案 README](https://github.com/pablodelucca/pixel-agents#office-assets)。

## 技術堆疊

- **Main process**: TypeScript, Electron
- **Renderer**: React 19, TypeScript, Vite, Canvas 2D

## 授權

本專案採用 [MIT License](LICENSE) 授權，與原始專案相同。
