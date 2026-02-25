## ADDED Requirements

### Requirement: Windows installer packaging
系統應使用 electron-builder 產生 Windows 安裝程式（NSIS 或 portable exe）。打包後的應用程式應包含所有資源、renderer bundle 及 main process bundle。

#### Scenario: Build produces installer
- **WHEN** 執行 `npm run package`
- **THEN** 在 `dist/` 目錄中產生可安裝的 Windows 執行檔

#### Scenario: Packaged app runs independently
- **WHEN** 打包後的應用程式在未安裝開發工具的 Windows 機器上安裝並啟動
- **THEN** 應用程式正常運作，所有 sprite、動畫及 Claude CLI 整合均可使用

### Requirement: App metadata
系統應將應用程式名稱定義為 "Pixel Agents"，使用原始的 `icon.png` 作為應用程式圖示，並在套件中包含版本資訊。

#### Scenario: App identity
- **WHEN** 應用程式安裝於 Windows
- **THEN** 在工作列與開始選單中以 "Pixel Agents" 名稱及像素藝術圖示顯示

### Requirement: Build script configuration
系統應提供 npm scripts，分別用於開發（`dev`）、建置（`build`）及打包（`package`）。開發模式應支援 renderer process 的 hot-reload。

#### Scenario: Development workflow
- **WHEN** 開發者執行 `npm run dev`
- **THEN** Electron app 以 Vite dev server 啟動 renderer，支援 hot module replacement
