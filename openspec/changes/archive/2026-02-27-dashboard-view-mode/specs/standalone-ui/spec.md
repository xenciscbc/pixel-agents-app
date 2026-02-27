## MODIFIED Requirements

### Requirement: Sound notification (modified)
系統應根據 Sound Settings 中的細項設定，在對應狀態事件發生時播放通知音效。僅限本機 agent 事件觸發。

#### Scenario: Waiting 音效
- **WHEN** 本機 agent 進入 waiting 狀態且 soundSettings.enabled 為 true 且 soundSettings.waiting 為 true
- **THEN** 播放通知音效

#### Scenario: Rest 音效
- **WHEN** 本機 agent 進入 rate_limited 狀態且 soundSettings.enabled 為 true 且 soundSettings.rest 為 true
- **THEN** 播放通知音效

#### Scenario: Needs Approval 音效
- **WHEN** 本機 agent 收到 agentToolPermission 且 soundSettings.enabled 為 true 且 soundSettings.needsApproval 為 true
- **THEN** 播放通知音效

#### Scenario: Idle 音效
- **WHEN** 本機 agent 變為 idle（agentToolsClear 且無 active tool）且 soundSettings.enabled 為 true 且 soundSettings.idle 為 true
- **THEN** 播放通知音效

#### Scenario: 總開關關閉
- **WHEN** soundSettings.enabled 為 false
- **THEN** 不播放任何音效，無論各事件 checkbox 狀態

---

## ADDED Requirements

### Requirement: statusHistory state
useExtensionMessages hook SHALL 新增 `statusHistory: Record<number, string[]>` state，追蹤每個 agent 的狀態歷史。

#### Scenario: 初始狀態
- **WHEN** app 啟動
- **THEN** statusHistory 為空 object `{}`

#### Scenario: 歷史更新
- **WHEN** 狀態事件觸發
- **THEN** 對應 agent 的歷史 array 更新（最新在 index 0，連續去重，上限 10 筆）

#### Scenario: hook 回傳
- **WHEN** 消費者存取 useExtensionMessages 回傳值
- **THEN** 可取得 `statusHistory` 欄位
