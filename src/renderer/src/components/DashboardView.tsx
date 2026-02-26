import { useMemo, useState, useEffect } from 'react'
import type { AgentMeta, SubagentCharacter } from '../hooks/useExtensionMessages.js'
import type { ToolActivity } from '../office/types.js'
import { projectDisplayName } from './AgentListPanel.js'

type DashboardLayout = 'grid' | 'list'

interface DashboardViewProps {
  agents: number[]
  agentMetas: Record<number, AgentMeta>
  agentStatuses: Record<number, string>
  agentTools: Record<number, ToolActivity[]>
  subagentCharacters: SubagentCharacter[]
  subagentTools: Record<number, Record<string, ToolActivity[]>>
  dashboardLayout: DashboardLayout
  onClickAgent: (id: number) => void
}

function relativeTime(ts: number | undefined): string {
  if (!ts) return ''
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 30) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const min = Math.floor(diff / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  return `${hr}h ago`
}

function getStatusDisplay(
  agentId: number,
  agentStatuses: Record<number, string>,
  agentTools: Record<number, ToolActivity[]>,
): { text: string; color: string; isPermission: boolean; currentTool: string | null } {
  const status = agentStatuses[agentId]
  if (status === 'waiting') {
    return { text: 'Waiting', color: 'var(--vscode-charts-yellow, #cca700)', isPermission: false, currentTool: null }
  }

  const tools = agentTools[agentId]
  if (tools && tools.length > 0) {
    const activeTool = [...tools].reverse().find((t) => !t.done)
    if (activeTool) {
      if (activeTool.permissionWait) {
        return { text: 'Needs approval', color: '#e55', isPermission: true, currentTool: activeTool.status }
      }
      return { text: 'Active', color: 'var(--vscode-charts-blue, #3794ff)', isPermission: false, currentTool: activeTool.status }
    }
  }

  return { text: 'Idle', color: 'rgba(255, 255, 255, 0.35)', isPermission: false, currentTool: null }
}

function AgentCard({
  agentId, meta, agentStatuses, agentTools,
  subs, subagentTools, layout, onClick,
}: {
  agentId: number
  meta: AgentMeta
  agentStatuses: Record<number, string>
  agentTools: Record<number, ToolActivity[]>
  subs: SubagentCharacter[]
  subagentTools: Record<number, Record<string, ToolActivity[]>>
  layout: DashboardLayout
  onClick: () => void
}) {
  const statusInfo = getStatusDisplay(agentId, agentStatuses, agentTools)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(30, 30, 46, 0.9)',
        border: '2px solid var(--pixel-border)',
        padding: '10px 14px',
        minWidth: layout === 'grid' ? 240 : undefined,
        width: layout === 'list' ? '100%' : undefined,
        cursor: 'pointer',
      }}
    >
      {/* Header: label + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '22px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', flex: 1 }}>
          {meta.label}
        </span>
        <span
          className={statusInfo.isPermission ? 'pixel-agents-pulse' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: '18px', color: statusInfo.color,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusInfo.color, flexShrink: 0 }} />
          {statusInfo.text}
        </span>
      </div>

      {/* Current tool */}
      {statusInfo.currentTool && (
        <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Current: {statusInfo.currentTool}
        </div>
      )}

      {/* Sub-agents */}
      {subs.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: 2 }}>
            Sub-agents: {subs.length}
          </div>
          {subs.map((sub) => {
            const st = subagentTools[agentId]?.[sub.parentToolId]
            const active = st?.find((t) => !t.done)
            return (
              <div key={sub.id} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '1px 0 1px 12px', fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                <span style={{ flexShrink: 0 }}>└</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--vscode-charts-blue, #3794ff)', flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.label}
                </span>
                {active && (
                  <span style={{ flexShrink: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {active.status}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Last activity */}
      {meta.lastActivity && (
        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.35)', marginTop: 6 }}>
          Last: {relativeTime(meta.lastActivity)}
        </div>
      )}
    </div>
  )
}

export function DashboardView({
  agents, agentMetas, agentStatuses, agentTools,
  subagentCharacters, subagentTools, dashboardLayout, onClickAgent,
}: DashboardViewProps) {
  // Force re-render every 30s for relative time updates
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  // Group agents by project
  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ id: number; meta: AgentMeta }>>()
    for (const id of agents) {
      const meta = agentMetas[id]
      if (!meta) continue
      const key = meta.projectDir || 'unknown'
      let list = map.get(key)
      if (!list) {
        list = []
        map.set(key, list)
      }
      list.push({ id, meta })
    }
    return map
  }, [agents, agentMetas])

  // Build sub-agent lookup
  const subsByParent = useMemo(() => {
    const map = new Map<number, SubagentCharacter[]>()
    for (const sub of subagentCharacters) {
      let list = map.get(sub.parentAgentId)
      if (!list) {
        list = []
        map.set(sub.parentAgentId, list)
      }
      list.push(sub)
    }
    return map
  }, [subagentCharacters])

  if (agents.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        background: 'var(--pixel-bg)',
        color: 'rgba(255, 255, 255, 0.35)', fontSize: '24px',
      }}>
        No active agents
      </div>
    )
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--pixel-bg)',
      overflowY: 'auto', padding: '24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 1200 }}>
        {[...grouped.entries()].map(([projectKey, agentList]) => (
          <div key={projectKey} style={{ marginBottom: 24 }}>
            {/* Project header */}
            <div style={{
              fontSize: '22px', color: 'var(--pixel-green)', fontWeight: 'bold',
              padding: '4px 0 8px', borderBottom: '1px solid var(--pixel-border)',
              marginBottom: 12,
            }}>
              {projectDisplayName(projectKey)}
            </div>

            {/* Agent cards */}
            <div style={
              dashboardLayout === 'grid'
                ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }
                : { display: 'flex', flexDirection: 'column' as const, gap: 8 }
            }>
              {agentList.map(({ id, meta }) => (
                <AgentCard
                  key={id}
                  agentId={id}
                  meta={meta}
                  agentStatuses={agentStatuses}
                  agentTools={agentTools}
                  subs={subsByParent.get(id) || []}
                  subagentTools={subagentTools}
                  layout={dashboardLayout}
                  onClick={() => onClickAgent(id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
