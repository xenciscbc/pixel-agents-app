## ADDED Requirements

### Requirement: Dev script process tree cleanup on Windows
`scripts/dev.mjs` 在 Windows 平台上 SHALL 使用 `taskkill /pid <pid> /T /F` 終止整個 process tree，確保 Vite 和 Electron 子進程在 dev script 結束時完全終止。

#### Scenario: Dev script cleanup on Windows
- **WHEN** dev script 在 Windows 上被中斷（Ctrl+C 或關閉終端）
- **THEN** 使用 `taskkill /T /F` 遞迴終止 Vite 和 Electron 的整個 process tree，不留下孤兒進程

#### Scenario: Dev script cleanup on non-Windows
- **WHEN** dev script 在 macOS/Linux 上被中斷
- **THEN** 使用標準 `.kill()` 或 process group signal 終止子進程
