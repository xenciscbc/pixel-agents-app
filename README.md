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
- **Sound notifications** — granular per-event sound control (see [Sound Notifications](#sound-notifications))
- **Sub-agent visualization** — Task tool sub-agents spawn as separate characters
- **Persistent layouts** — your office design is saved across sessions
- **Two view modes + agent panel** — Office (pixel art), Dashboard (card-based), plus a draggable agent list panel overlay
- **LAN peer sharing** — see agents from other machines on the same network
- **Status history** — click any agent to see recent activity history
- **Window controls** — always-on-top, system tray, minimize to tray
- **Minimized mode** — start hidden in system tray with `-min` flag

## System Tray

The app always creates a system tray icon. Right-click the tray icon for:
- **Show Window** — bring the window to front
- **Exit** — quit the application

### Minimized Mode (`-min`)

Launch with the `-min` flag to start the app hidden in the system tray without showing the window:

```bash
# Development
pnpm run dev -- -min

# Packaged app
"Pixel Agents.exe" -min
```

In this mode:
- The window is not created on startup — the app runs silently in the tray
- Click "Show Window" in the tray menu to open the window
- Closing the window returns to tray instead of quitting
- Use "Exit" from the tray menu to fully quit

## View Modes

Switch between view modes using the bottom toolbar:

| Mode | Description |
|---|---|
| **Office** | Animated pixel art office with characters walking and typing. Hover over characters to see name and status. |
| **Dashboard** | Card-based grid/list view. Each card shows agent label, status, current tool, sub-agents, and last activity time. Supports grid and list layouts. |

The **List** panel is a compact draggable/resizable side panel that overlays the Office view, showing all agents grouped by project. Toggle it from the bottom toolbar while in Office mode.

In all views, **click an agent** to open a popup showing the most recent 10 status events (consecutive-deduplicated).

## Agent Status Detection

Agent status is determined by continuously tailing the JSONL transcript file that Claude Code writes during each session. The parser ([transcriptParser.ts](src/main/transcriptParser.ts)) reads each new line and updates the agent's state:

| Status | Condition | Visual |
|---|---|---|
| **Active** | Agent is outputting text or executing tools | Character typing animation |
| **Waiting** | A `turn_duration` system record is received (turn ended), or the agent outputs only text with no tool use for 5 seconds (`TEXT_IDLE_DELAY_MS`) | Speech bubble "waiting" |
| **Needs Approval** | A tool has been running for 7 seconds (`PERMISSION_TIMER_DELAY_MS`) without completing, and it's not in the exempt list (`Task`, `AskUserQuestion`) | Pulsing red dot + speech bubble |
| **Rest** | Agent is rate-limited by the API | Red "Rest" indicator |
| **Idle** | No recent JSONL activity; session may have ended | Grey status dot |

### Sound Notifications

Sound notifications use a two-note ascending chime (E5 → E6). Each event type can be independently enabled or disabled in **Settings > Sound**:

| Event | Default | When it plays |
|---|---|---|
| **Enable Sound** | On | Master toggle — disables all sounds when off |
| **Waiting** | On | Agent finished its turn, waiting for user input |
| **Rest** | On | Agent hit API rate limit |
| **Needs Approval** | On | A tool is waiting for user permission |
| **Idle** | Off | Agent becomes idle (all tools done, no active work) |

When the master "Enable Sound" toggle is off, all sub-options are visually disabled and no sound plays regardless of individual settings.

## LAN Peer Sharing

See agents from other machines running Pixel Agents on the same local network. This is **read-only** — you can observe remote agents but not control them.

### How it works

1. Each instance broadcasts its agent state via UDP on the local network
2. Other instances on the same subnet discover and display remote agents
3. Remote agents appear in all three view modes with the peer name prefix

### Configuration (Settings > Network)

| Setting | Default | Description |
|---|---|---|
| **Peer Name** | Computer hostname | Display name shown to other peers |
| **Broadcast** | Enabled | Toggle broadcasting on/off |
| **UDP Port** | 47800 | Port used for peer discovery (must match across peers) |
| **Heartbeat Interval** | 30s | How often to broadcast agent state |

> **Note**: All peers must use the same UDP port to see each other. Remote agent history is limited by the heartbeat interval — status changes between heartbeats are not captured.

## Settings

Open Settings from the gear icon in the bottom toolbar. Available sections:

### Watch Directories
- **Add Claude Root** — monitors `~/.claude/projects` for all active sessions
- **Add Project** — monitor a specific project directory
- **Active Threshold** — minutes of inactivity before a session is considered stale (default: 30)

### Window
- **Always on Top** — keep the window above other windows

### Network
- Peer Name, Broadcast toggle, UDP Port, Heartbeat Interval (see [LAN Peer Sharing](#lan-peer-sharing))

### Sound
- Master toggle + per-event controls (see [Sound Notifications](#sound-notifications))

### Display
- **Font Scale** — adjust UI text size from 0.5x to 3.0x (affects all views)

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
