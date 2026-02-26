# dev-script Specification

## Purpose

跨平台開發啟動腳本，管理 Vite 和 Electron 子 process 的生命週期。

## Requirements

### Requirement: 跨平台 dev 啟動腳本
系統須提供 Node.js 啟動腳本 `scripts/dev.mjs`，取代現有的 `concurrently` + Unix 環境變數方式，在 Windows 和 macOS 上均可運作。

#### Scenario: 預設 port 啟動
- **WHEN** 執行 `pnpm run dev`（未設定 devPort）
- **THEN** Vite dev server 在 port 5173 啟動，Electron 載入 `http://localhost:5173`

#### Scenario: 自訂 port 啟動
- **WHEN** settings.json 中 devPort 設定為 9000
- **THEN** Vite dev server 在 port 9000 啟動，Electron 載入 `http://localhost:9000`

#### Scenario: Port 衝突
- **WHEN** 指定的 port 已被佔用
- **THEN** Vite 以 strictPort 模式啟動失敗並報錯，而非靜默切換 port

---

### Requirement: Process 管理
dev 腳本須同時管理 Vite 和 Electron 兩個子 process，提供統一的輸出及生命週期控制。

#### Scenario: 統一輸出
- **WHEN** dev 腳本啟動
- **THEN** Vite 和 Electron 的 stdout/stderr 以 prefix 區分（`[vite]` / `[electron]`）輸出到終端

#### Scenario: 連鎖退出
- **WHEN** 任一子 process 結束（正常或異常）
- **THEN** 腳本終止另一個子 process 並退出

---

### Requirement: Electron dev port 接收
Electron main process 須從 CLI 參數接收 dev port，用於載入 Vite dev server。

#### Scenario: 讀取 dev-port 參數
- **WHEN** Electron 以 `--dev-port=9000` 啟動且 app 未打包
- **THEN** main window 載入 `http://localhost:9000`

#### Scenario: 無參數 fallback
- **WHEN** Electron 啟動時未提供 `--dev-port` 參數且 app 未打包
- **THEN** main window 載入 `http://localhost:5173`

#### Scenario: 打包模式忽略參數
- **WHEN** app 已打包（`app.isPackaged === true`）
- **THEN** 忽略 `--dev-port` 參數，載入本地 renderer 檔案

---

### Requirement: 移除 concurrently 依賴
dev 腳本完成後，須從 package.json 移除 `concurrently` devDependency。

#### Scenario: 依賴清理
- **WHEN** dev script 改為 `scripts/dev.mjs`
- **THEN** `concurrently` 從 devDependencies 移除
