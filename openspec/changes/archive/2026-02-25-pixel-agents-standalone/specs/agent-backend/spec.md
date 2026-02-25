## ADDED Requirements

### Requirement: Claude CLI process spawning
系統應使用 `child_process.spawn('claude', ['--session-id', sessionId])` 產生 Claude CLI，並以所選專案目錄作為 cwd。已產生的 process 應依 agent ID 進行追蹤。

#### Scenario: New agent creation
- **WHEN** renderer 請求建立新的 Claude agent
- **THEN** 以產生的 session UUID 啟動一個 `claude` process，並向 renderer 傳送 `agentCreated` 訊息

#### Scenario: Process exit detection
- **WHEN** 已產生的 Claude CLI process 結束
- **THEN** 清除該 agent（取消計時器、停止 watcher），並向 renderer 傳送 `agentClosed` 訊息

### Requirement: JSONL transcript monitoring
系統應使用 `fs.watch`（並備有 polling fallback）監控 `~/.claude/projects/<encoded-path>/` 中的 JSONL transcript 文件。新的行應被解析並轉換為 agent 狀態訊息。

#### Scenario: Tool start detection
- **WHEN** 新的 JSONL 行包含 tool_use 條目
- **THEN** 向 renderer 傳送 `agentToolStart` 訊息，附帶 tool ID 與狀態

#### Scenario: Tool completion detection
- **WHEN** JSONL 行包含與活躍 tool ID 對應的 tool_result 條目
- **THEN** 向 renderer 傳送 `agentToolDone` 訊息

#### Scenario: Waiting state detection
- **WHEN** 在最後一條無活躍 tools 的 assistant 訊息後 7 秒內未偵測到新的 JSONL 活動
- **THEN** 向 renderer 傳送 `agentStatus: waiting` 訊息

#### Scenario: Permission state detection
- **WHEN** 在 tools 活躍期間 7 秒內未偵測到新的 JSONL 活動
- **THEN** 向 renderer 傳送 `agentToolPermission` 訊息

### Requirement: Project directory scanning
系統應每隔 1 秒定期掃描專案目錄，以尋找新的 JSONL 文件，用於偵測建立新 session 的 `/clear` 指令。不在已知集合中的新文件應被採用為活躍 agent 的替換 session。

#### Scenario: Clear command detection
- **WHEN** 專案目錄中出現不在已知文件集合中的新 JSONL 文件
- **THEN** 更新活躍 agent 的 JSONL 文件為新文件，並重新啟動文件監控

### Requirement: Agent state persistence
系統應將 agent 元數據（ID、session 文件路徑、專案目錄）持久化儲存至應用程式 userData 目錄的 JSON 文件中。重新啟動時，已持久化的 agents 應對照執行中的 Claude CLI process 進行核驗。

#### Scenario: Agent persistence on creation
- **WHEN** 新的 agent 被建立或移除
- **THEN** agent 清單被序列化至 userData 目錄中的 `agents.json`

#### Scenario: Agent restoration on restart
- **WHEN** 應用程式啟動時存在已持久化的 agents
- **THEN** JSONL 文件仍存在的 agents 被還原，並從文件末尾繼續進行文件監控

### Requirement: Subagent tracking
系統應偵測 JSONL transcript 中的 Task tool 調用，並建立 subagent 角色。Subagent tool 事件應以 `subagentToolStart`、`subagentToolDone` 及 `subagentClear` 訊息的形式轉發。

#### Scenario: Subagent creation from Task tool
- **WHEN** 偵測到 status 以 "Subtask:" 開頭的 tool_use 條目
- **THEN** main process 追蹤該 subagent，並向 renderer 傳送相應的建立訊息
