"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS_KEY_PROJECT_DIR = exports.SETTINGS_KEY_AGENT_SEATS = exports.SETTINGS_KEY_AGENTS = exports.SETTINGS_KEY_SOUND_ENABLED = exports.LAYOUT_FILE_POLL_INTERVAL_MS = exports.LAYOUT_FILE_NAME = exports.LAYOUT_FILE_DIR = exports.CHAR_COUNT = exports.CHAR_FRAMES_PER_ROW = exports.CHAR_FRAME_H = exports.CHAR_FRAME_W = exports.CHARACTER_DIRECTIONS = exports.FLOOR_TILE_SIZE = exports.FLOOR_PATTERN_COUNT = exports.WALL_BITMASK_COUNT = exports.WALL_GRID_COLS = exports.WALL_PIECE_HEIGHT = exports.WALL_PIECE_WIDTH = exports.PNG_ALPHA_THRESHOLD = exports.TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = exports.BASH_COMMAND_DISPLAY_MAX_LENGTH = exports.TEXT_IDLE_DELAY_MS = exports.PERMISSION_TIMER_DELAY_MS = exports.TOOL_DONE_DELAY_MS = exports.PROJECT_SCAN_INTERVAL_MS = exports.FILE_WATCHER_POLL_INTERVAL_MS = exports.JSONL_POLL_INTERVAL_MS = void 0;
// ── Timing (ms) ──────────────────────────────────────────────
exports.JSONL_POLL_INTERVAL_MS = 1000;
exports.FILE_WATCHER_POLL_INTERVAL_MS = 2000;
exports.PROJECT_SCAN_INTERVAL_MS = 1000;
exports.TOOL_DONE_DELAY_MS = 300;
exports.PERMISSION_TIMER_DELAY_MS = 7000;
exports.TEXT_IDLE_DELAY_MS = 5000;
// ── Display Truncation ──────────────────────────────────────
exports.BASH_COMMAND_DISPLAY_MAX_LENGTH = 30;
exports.TASK_DESCRIPTION_DISPLAY_MAX_LENGTH = 40;
// ── PNG / Asset Parsing ─────────────────────────────────────
exports.PNG_ALPHA_THRESHOLD = 128;
exports.WALL_PIECE_WIDTH = 16;
exports.WALL_PIECE_HEIGHT = 32;
exports.WALL_GRID_COLS = 4;
exports.WALL_BITMASK_COUNT = 16;
exports.FLOOR_PATTERN_COUNT = 7;
exports.FLOOR_TILE_SIZE = 16;
exports.CHARACTER_DIRECTIONS = ['down', 'up', 'right'];
exports.CHAR_FRAME_W = 16;
exports.CHAR_FRAME_H = 32;
exports.CHAR_FRAMES_PER_ROW = 7;
exports.CHAR_COUNT = 6;
// ── User-Level Layout Persistence ─────────────────────────────
exports.LAYOUT_FILE_DIR = '.pixel-agents';
exports.LAYOUT_FILE_NAME = 'layout.json';
exports.LAYOUT_FILE_POLL_INTERVAL_MS = 2000;
// ── Settings Persistence ────────────────────────────────────
exports.SETTINGS_KEY_SOUND_ENABLED = 'soundEnabled';
exports.SETTINGS_KEY_AGENTS = 'agents';
exports.SETTINGS_KEY_AGENT_SEATS = 'agentSeats';
exports.SETTINGS_KEY_PROJECT_DIR = 'projectDir';
//# sourceMappingURL=constants.js.map