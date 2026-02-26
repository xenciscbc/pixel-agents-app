"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTINGS_KEY_FONT_SCALE = exports.SETTINGS_KEY_AGENT_LIST_PANEL_SIZE = exports.SETTINGS_KEY_DASHBOARD_LAYOUT = exports.SETTINGS_KEY_VIEW_MODE = exports.SETTINGS_KEY_DEV_PORT = exports.SETTINGS_KEY_SCAN_INTERVAL = exports.SETTINGS_KEY_ACTIVE_THRESHOLD = exports.SETTINGS_KEY_WATCH_DIRS = void 0;
exports.getSetting = getSetting;
exports.setSetting = setSetting;
exports.getWatchDirs = getWatchDirs;
exports.setWatchDirs = setWatchDirs;
exports.getActiveThreshold = getActiveThreshold;
exports.setActiveThreshold = setActiveThreshold;
exports.getScanInterval = getScanInterval;
exports.setScanInterval = setScanInterval;
exports.getDevPort = getDevPort;
exports.getViewMode = getViewMode;
exports.setViewMode = setViewMode;
exports.getDashboardLayout = getDashboardLayout;
exports.setDashboardLayout = setDashboardLayout;
exports.getAgentListPanelSize = getAgentListPanelSize;
exports.setAgentListPanelSize = setAgentListPanelSize;
exports.getFontScale = getFontScale;
exports.setFontScale = setFontScale;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
exports.SETTINGS_KEY_WATCH_DIRS = 'watchDirs';
exports.SETTINGS_KEY_ACTIVE_THRESHOLD = 'activeThresholdMinutes';
exports.SETTINGS_KEY_SCAN_INTERVAL = 'scanIntervalSeconds';
exports.SETTINGS_KEY_DEV_PORT = 'devPort';
exports.SETTINGS_KEY_VIEW_MODE = 'viewMode';
exports.SETTINGS_KEY_DASHBOARD_LAYOUT = 'dashboardLayout';
exports.SETTINGS_KEY_AGENT_LIST_PANEL_SIZE = 'agentListPanelSize';
exports.SETTINGS_KEY_FONT_SCALE = 'fontScale';
let settingsCache = null;
function getSettingsPath() {
    return path.join(electron_1.app.getPath('userData'), 'settings.json');
}
function loadSettings() {
    if (settingsCache)
        return settingsCache;
    try {
        const p = getSettingsPath();
        if (fs.existsSync(p)) {
            settingsCache = JSON.parse(fs.readFileSync(p, 'utf-8'));
            return settingsCache;
        }
    }
    catch { /* start fresh */ }
    settingsCache = {};
    return settingsCache;
}
function saveSettings() {
    try {
        const p = getSettingsPath();
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(p, JSON.stringify(settingsCache || {}, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('[Settings] Failed to save:', err);
    }
}
function getSetting(key, defaultValue) {
    const settings = loadSettings();
    return (key in settings ? settings[key] : defaultValue);
}
function setSetting(key, value) {
    const settings = loadSettings();
    settings[key] = value;
    saveSettings();
}
function getWatchDirs() {
    return getSetting(exports.SETTINGS_KEY_WATCH_DIRS, []);
}
function setWatchDirs(dirs) {
    setSetting(exports.SETTINGS_KEY_WATCH_DIRS, dirs);
}
function getActiveThreshold() {
    return getSetting(exports.SETTINGS_KEY_ACTIVE_THRESHOLD, 30);
}
function setActiveThreshold(minutes) {
    setSetting(exports.SETTINGS_KEY_ACTIVE_THRESHOLD, minutes);
}
function getScanInterval() {
    return getSetting(exports.SETTINGS_KEY_SCAN_INTERVAL, 30);
}
function setScanInterval(seconds) {
    setSetting(exports.SETTINGS_KEY_SCAN_INTERVAL, seconds);
}
function getDevPort() {
    return getSetting(exports.SETTINGS_KEY_DEV_PORT, 5173);
}
function getViewMode() {
    return getSetting(exports.SETTINGS_KEY_VIEW_MODE, 'office');
}
function setViewMode(mode) {
    setSetting(exports.SETTINGS_KEY_VIEW_MODE, mode);
}
function getDashboardLayout() {
    return getSetting(exports.SETTINGS_KEY_DASHBOARD_LAYOUT, 'grid');
}
function setDashboardLayout(layout) {
    setSetting(exports.SETTINGS_KEY_DASHBOARD_LAYOUT, layout);
}
function getAgentListPanelSize() {
    return getSetting(exports.SETTINGS_KEY_AGENT_LIST_PANEL_SIZE, { width: 220, height: 300 });
}
function setAgentListPanelSize(size) {
    setSetting(exports.SETTINGS_KEY_AGENT_LIST_PANEL_SIZE, size);
}
function getFontScale() {
    return getSetting(exports.SETTINGS_KEY_FONT_SCALE, 1.0);
}
function setFontScale(scale) {
    setSetting(exports.SETTINGS_KEY_FONT_SCALE, scale);
}
//# sourceMappingURL=settingsStore.js.map