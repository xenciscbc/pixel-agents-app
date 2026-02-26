"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAgentActivity = clearAgentActivity;
exports.cancelWaitingTimer = cancelWaitingTimer;
exports.startWaitingTimer = startWaitingTimer;
exports.cancelPermissionTimer = cancelPermissionTimer;
exports.startPermissionTimer = startPermissionTimer;
const constants_1 = require("./constants");
function clearAgentActivity(agent, agentId, permissionTimers, sender) {
    if (!agent)
        return;
    agent.activeToolIds.clear();
    agent.activeToolStatuses.clear();
    agent.activeToolNames.clear();
    agent.activeSubagentToolIds.clear();
    agent.activeSubagentToolNames.clear();
    agent.isWaiting = false;
    agent.permissionSent = false;
    cancelPermissionTimer(agentId, permissionTimers);
    sender?.postMessage({ type: 'agentToolsClear', id: agentId });
    sender?.postMessage({ type: 'agentStatus', id: agentId, status: 'active' });
}
function cancelWaitingTimer(agentId, waitingTimers) {
    const timer = waitingTimers.get(agentId);
    if (timer) {
        clearTimeout(timer);
        waitingTimers.delete(agentId);
    }
}
function startWaitingTimer(agentId, delayMs, agents, waitingTimers, sender) {
    cancelWaitingTimer(agentId, waitingTimers);
    const timer = setTimeout(() => {
        waitingTimers.delete(agentId);
        const agent = agents.get(agentId);
        if (agent) {
            agent.isWaiting = true;
        }
        sender?.postMessage({
            type: 'agentStatus',
            id: agentId,
            status: 'waiting',
        });
    }, delayMs);
    waitingTimers.set(agentId, timer);
}
function cancelPermissionTimer(agentId, permissionTimers) {
    const timer = permissionTimers.get(agentId);
    if (timer) {
        clearTimeout(timer);
        permissionTimers.delete(agentId);
    }
}
function startPermissionTimer(agentId, agents, permissionTimers, permissionExemptTools, sender) {
    cancelPermissionTimer(agentId, permissionTimers);
    const timer = setTimeout(() => {
        permissionTimers.delete(agentId);
        const agent = agents.get(agentId);
        if (!agent)
            return;
        let hasNonExempt = false;
        for (const toolId of agent.activeToolIds) {
            const toolName = agent.activeToolNames.get(toolId);
            if (!permissionExemptTools.has(toolName || '')) {
                hasNonExempt = true;
                break;
            }
        }
        const stuckSubagentParentToolIds = [];
        for (const [parentToolId, subToolNames] of agent.activeSubagentToolNames) {
            for (const [, toolName] of subToolNames) {
                if (!permissionExemptTools.has(toolName)) {
                    stuckSubagentParentToolIds.push(parentToolId);
                    hasNonExempt = true;
                    break;
                }
            }
        }
        if (hasNonExempt) {
            agent.permissionSent = true;
            console.log(`[Pixel Agents] Agent ${agentId}: possible permission wait detected`);
            sender?.postMessage({
                type: 'agentToolPermission',
                id: agentId,
            });
            for (const parentToolId of stuckSubagentParentToolIds) {
                sender?.postMessage({
                    type: 'subagentToolPermission',
                    id: agentId,
                    parentToolId,
                });
            }
        }
    }, constants_1.PERMISSION_TIMER_DELAY_MS);
    permissionTimers.set(agentId, timer);
}
//# sourceMappingURL=timerManager.js.map