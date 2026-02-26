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
exports.startFileWatching = startFileWatching;
exports.readNewLines = readNewLines;
exports.ensureProjectScan = ensureProjectScan;
exports.reassignAgentToFile = reassignAgentToFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const timerManager_1 = require("./timerManager");
const transcriptParser_1 = require("./transcriptParser");
const constants_1 = require("./constants");
function startFileWatching(agentId, filePath, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender) {
    try {
        const watcher = fs.watch(filePath, () => {
            readNewLines(agentId, agents, waitingTimers, permissionTimers, sender);
        });
        fileWatchers.set(agentId, watcher);
    }
    catch (e) {
        console.log(`[Pixel Agents] fs.watch failed for agent ${agentId}: ${e}`);
    }
    const interval = setInterval(() => {
        if (!agents.has(agentId)) {
            clearInterval(interval);
            return;
        }
        readNewLines(agentId, agents, waitingTimers, permissionTimers, sender);
    }, constants_1.FILE_WATCHER_POLL_INTERVAL_MS);
    pollingTimers.set(agentId, interval);
}
function readNewLines(agentId, agents, waitingTimers, permissionTimers, sender) {
    const agent = agents.get(agentId);
    if (!agent)
        return;
    try {
        const stat = fs.statSync(agent.jsonlFile);
        if (stat.size <= agent.fileOffset)
            return;
        const buf = Buffer.alloc(stat.size - agent.fileOffset);
        const fd = fs.openSync(agent.jsonlFile, 'r');
        fs.readSync(fd, buf, 0, buf.length, agent.fileOffset);
        fs.closeSync(fd);
        agent.fileOffset = stat.size;
        const text = agent.lineBuffer + buf.toString('utf-8');
        const lines = text.split('\n');
        agent.lineBuffer = lines.pop() || '';
        const hasLines = lines.some(l => l.trim());
        if (hasLines) {
            (0, timerManager_1.cancelWaitingTimer)(agentId, waitingTimers);
            (0, timerManager_1.cancelPermissionTimer)(agentId, permissionTimers);
            if (agent.permissionSent) {
                agent.permissionSent = false;
                sender?.postMessage({ type: 'agentToolPermissionClear', id: agentId });
            }
        }
        for (const line of lines) {
            if (!line.trim())
                continue;
            (0, transcriptParser_1.processTranscriptLine)(agentId, line, agents, waitingTimers, permissionTimers, sender);
        }
    }
    catch (e) {
        console.log(`[Pixel Agents] Read error for agent ${agentId}: ${e}`);
    }
}
function ensureProjectScan(projectDir, knownJsonlFiles, projectScanTimerRef, activeAgentIdRef, nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender, persistAgents) {
    if (projectScanTimerRef.current)
        return;
    try {
        const files = fs.readdirSync(projectDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => path.join(projectDir, f));
        for (const f of files) {
            knownJsonlFiles.add(f);
        }
    }
    catch { /* dir may not exist yet */ }
    projectScanTimerRef.current = setInterval(() => {
        scanForNewJsonlFiles(projectDir, knownJsonlFiles, activeAgentIdRef, nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender, persistAgents);
    }, constants_1.PROJECT_SCAN_INTERVAL_MS);
}
function scanForNewJsonlFiles(projectDir, knownJsonlFiles, activeAgentIdRef, nextAgentIdRef, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender, persistAgents) {
    let files;
    try {
        files = fs.readdirSync(projectDir)
            .filter(f => f.endsWith('.jsonl'))
            .map(f => path.join(projectDir, f));
    }
    catch {
        return;
    }
    for (const file of files) {
        if (!knownJsonlFiles.has(file)) {
            knownJsonlFiles.add(file);
            if (activeAgentIdRef.current !== null) {
                console.log(`[Pixel Agents] New JSONL detected: ${path.basename(file)}, reassigning to agent ${activeAgentIdRef.current}`);
                reassignAgentToFile(activeAgentIdRef.current, file, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender, persistAgents);
            }
            // In standalone mode, we don't adopt terminals — agents are always spawned explicitly
        }
    }
}
function reassignAgentToFile(agentId, newFilePath, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender, persistAgents) {
    const agent = agents.get(agentId);
    if (!agent)
        return;
    fileWatchers.get(agentId)?.close();
    fileWatchers.delete(agentId);
    const pt = pollingTimers.get(agentId);
    if (pt) {
        clearInterval(pt);
    }
    pollingTimers.delete(agentId);
    (0, timerManager_1.cancelWaitingTimer)(agentId, waitingTimers);
    (0, timerManager_1.cancelPermissionTimer)(agentId, permissionTimers);
    (0, timerManager_1.clearAgentActivity)(agent, agentId, permissionTimers, sender);
    agent.jsonlFile = newFilePath;
    agent.fileOffset = 0;
    agent.lineBuffer = '';
    persistAgents();
    startFileWatching(agentId, newFilePath, agents, fileWatchers, pollingTimers, waitingTimers, permissionTimers, sender);
    readNewLines(agentId, agents, waitingTimers, permissionTimers, sender);
}
//# sourceMappingURL=fileWatcher.js.map