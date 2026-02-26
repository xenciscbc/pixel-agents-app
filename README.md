# Pixel Agents — Standalone Electron App

A standalone Electron desktop application that visualizes your Claude Code agents as animated pixel art characters in a virtual office.

This project is a **standalone fork** extracted from the original VS Code extension **[Pixel Agents](https://github.com/pablodelucca/pixel-agents)** by **[Pablo De Lucca](https://github.com/pablodelucca)**.

## Origin

- **Original project**: [pablodelucca/pixel-agents](https://github.com/pablodelucca/pixel-agents)
- **Original author**: Pablo De Lucca
- **Original license**: MIT
- **VS Code Marketplace**: [Pixel Agents](https://marketplace.visualstudio.com/items?itemName=pablodelucca.pixel-agents)

The original project is a VS Code extension. This standalone version runs as an independent Electron app, decoupled from VS Code, with additional features for multi-project session monitoring.

## What's Different

Compared to the original VS Code extension, this standalone version adds:

- **Independent Electron app** — no VS Code dependency required
- **Watch mode** — automatically discovers and monitors active Claude Code sessions from `~/.claude/projects`
- **Multi-project support** — observe agents across multiple project directories simultaneously
- **Observe mode** — passively monitors existing Claude Code sessions without spawning or killing processes
- **Settings UI** — built-in settings panel for configuring watch directories, active threshold, and scan interval
- **Agent list panel** — draggable side panel showing agents grouped by project with live status
- **Configurable dev port** — cross-platform development script with settings-based port configuration

## Features

- **One agent, one character** — every Claude Code session gets its own animated character
- **Live activity tracking** — characters animate based on what the agent is actually doing
- **Office layout editor** — design your office with floors, walls, and furniture
- **Speech bubbles** — visual indicators when an agent is waiting or needs permission
- **Sound notifications** — optional chime when an agent finishes its turn
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters
- **Persistent layouts** — your office design is saved across sessions

## Requirements

- Node.js 18+
- [pnpm](https://pnpm.io/)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and configured

## Getting Started

```bash
pnpm install
pnpm run dev
```

## Build & Package

Build all (main + preload + renderer):

```bash
pnpm run build
```

Package as portable executable (no installation required):

```bash
# Windows + Mac
pnpm run package

# Windows only — outputs release/Pixel Agents *.exe (portable)
pnpm package:win

# Mac only — outputs release/Pixel Agents *.dmg
pnpm package:mac
```

> **Note**: Cross-platform packaging has limitations — building Mac packages requires running on macOS (or using CI with a macOS runner). Windows portable `.exe` can only be built on Windows.

## Office Assets

The office tileset used in this project is **[Office Interior Tileset (16x16)](https://donarg.itch.io/officetileset)** by **Donarg**. See the [original project README](https://github.com/pablodelucca/pixel-agents#office-assets) for details on asset licensing.

## Tech Stack

- **Main process**: TypeScript, Electron
- **Renderer**: React 19, TypeScript, Vite, Canvas 2D

## License

This project is licensed under the [MIT License](LICENSE), same as the original project.
