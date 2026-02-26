## Context

transcriptParser 解析 JSONL transcript 判別 agent 狀態。目前處理 `type: "assistant"` 時只看 tool_use blocks 和 text blocks，不檢查 `error` 欄位。當 API rate limit 發生時，JSONL record 帶有 `error: "rate_limit"` 和 `isApiErrorMessage: true`，但目前被忽略，agent 被誤判為 Waiting。

提示音在 renderer 端的 `useExtensionMessages` 中，當收到 `agentStatus` 且 `status === 'waiting'` 時呼叫 `playDoneSound()`。

## Goals / Non-Goals

**Goals:**
- 偵測 rate_limit error 並正確顯示 "Rest" 狀態（紅色）
- rate_limited 狀態觸發提示音
- 移除 pixel font 不適合的 `fontWeight: 'bold'`

**Non-Goals:**
- 不需要顯示 rate limit reset 時間（transcript 中的文字包含，但不另外解析）
- 不需要自動重試或特殊恢復機制

## Decisions

### 1. transcriptParser 偵測 rate_limit

**選擇**: 在 `processTranscriptLine` 中，處理 `type === "assistant"` 時先檢查 `record.error === "rate_limit"`。

**實作**: 在 `record.type === 'assistant'` 分支的最開頭加入 rate_limit 偵測：
```
if (record.type === 'assistant' && record.error === 'rate_limit') {
  // 清除 active tools（同 turn_duration 邏輯）
  // 發送 agentStatus: 'rate_limited'
  return
}
```

不使用 `isApiErrorMessage` — `error === "rate_limit"` 已足夠精確。

### 2. rate_limited 狀態觸發提示音

**選擇**: 在 renderer 的 `useExtensionMessages` 中，`agentStatus` handler 增加 `status === 'rate_limited'` 也呼叫 `playDoneSound()`。

**理由**: rate limit 和 waiting 一樣是「agent 停下來了」的信號，使用者需要被通知。

### 3. UI 紅色 "Rest" 顯示

**選擇**: 所有狀態判斷函數中新增 `rate_limited` 條件，統一使用紅色 `#e55`。

需修改的狀態判斷函數：
- `AgentListPanel.tsx` → `getStatusInfo()`
- `DashboardView.tsx` → `getStatusDisplay()`
- `AgentLabels.tsx` → 狀態判斷邏輯

### 4. 移除 `fontWeight: 'bold'`

**選擇**: 全域移除，pixel font 不使用粗體。

影響位置：
- `AgentListPanel.tsx` — project header
- `DashboardView.tsx` — agent label、project header

### 5. Font Scale 設定

**選擇**: 使用 `fontScale` 數值（預設 1.0）對 AgentListPanel、DashboardView、AgentLabels 的 fontSize 做等比例縮放。

**實作路徑**:
- `settingsStore.ts` — 新增 `fontScale` key，getter/setter
- `agentController.ts` — `setFontScale` IPC handler（保存並回傳 `fontScaleLoaded`）、`getFontScale` handler、`handleWebviewReady` 發送初始值
- `useExtensionMessages.ts` — `fontScale` state + `fontScaleLoaded` 訊息處理
- `App.tsx` → `BottomToolbar` → `SettingsModal` 傳遞 prop chain
- 各元件使用 `fs(base)` helper 函數計算縮放後的 fontSize

**UI**: SettingsModal 中的 range slider，0.5x ~ 3.0x，step 0.1，即時生效。

**理由**: scale factor 比絕對字體大小更合理——不同元素有不同基礎大小（標題 22px、內文 18px、狀態 14px），等比縮放保持視覺層次。

## Risks / Trade-offs

- **[rate_limit 偵測遺漏]** 若 Claude 未來更改 error 格式 → 保守做法，只匹配 `error === "rate_limit"`，不做模糊匹配。
- **[重複提示音]** 若多個 agent 同時 rate limit → 每個都會觸發一次提示音，與 waiting 行為一致，可接受。
- **[Font Scale 極值]** 過大或過小的 fontScale 可能導致 UI 溢出或難以閱讀 → 限制範圍 0.5x~3.0x，使用者自行調整。
