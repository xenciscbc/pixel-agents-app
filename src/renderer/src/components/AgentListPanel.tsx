import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import type { AgentMeta, SubagentCharacter, RemotePeer } from '../hooks/useExtensionMessages.js'
import type { ToolActivity } from '../office/types.js'
import { vscode } from '../vscodeApi.js'
import { getRemoteAgentId } from '../remoteAgentId.js'

interface AgentListPanelProps {
  agents: number[]
  agentMetas: Record<number, AgentMeta>
  agentStatuses: Record<number, string>
  agentTools: Record<number, ToolActivity[]>
  subagentCharacters: SubagentCharacter[]
  subagentTools: Record<number, Record<string, ToolActivity[]>>
  fontScale: number
  remotePeers: RemotePeer[]
  onAgentClick?: (agentId: number, label: string, position: { x: number; y: number }) => void
}

/** Convert encoded dir name back to readable project name. */
export function projectDisplayName(dirName: string): string {
  if (dirName.includes('/') || dirName.includes('\\')) {
    const segments = dirName.replace(/[\\/]+$/, '').split(/[\\/]/)
    return segments[segments.length - 1] || dirName
  }
  const stripped = dirName.replace(/^[A-Za-z]--/, '')
  const parts = stripped.split('-').filter(Boolean)
  if (parts.length <= 2) return parts.join('-') || dirName
  return parts.slice(-2).join('-')
}

function getStatusInfo(
  agentId: number,
  agentStatuses: Record<number, string>,
  agentTools: Record<number, ToolActivity[]>,
): { text: string; color: string; isPermission: boolean } {
  const status = agentStatuses[agentId]
  if (status === 'waiting') {
    return { text: 'Waiting', color: 'var(--vscode-charts-yellow, #cca700)', isPermission: false }
  }
  if (status === 'rate_limited') {
    return { text: 'Rest', color: '#e55', isPermission: false }
  }

  const tools = agentTools[agentId]
  if (tools && tools.length > 0) {
    const activeTool = [...tools].reverse().find((t) => !t.done)
    if (activeTool) {
      if (activeTool.permissionWait) {
        return { text: 'Needs approval', color: '#e55', isPermission: true }
      }
      return { text: activeTool.status, color: 'var(--vscode-charts-blue, #3794ff)', isPermission: false }
    }
  }

  return { text: 'Idle', color: 'rgba(255, 255, 255, 0.35)', isPermission: false }
}

const DEFAULT_WIDTH = 220
const DEFAULT_HEIGHT = 300
const MIN_WIDTH = 160
const MIN_HEIGHT = 120
const PANEL_MARGIN = 8
const RESIZE_HIT = 8

export function AgentListPanel({
  agents, agentMetas, agentStatuses, agentTools,
  subagentCharacters, subagentTools, fontScale, remotePeers, onAgentClick,
}: AgentListPanelProps) {
  const fs = (base: number) => `${Math.round(base * fontScale)}px`
  const [pos, setPos] = useState({ x: window.innerWidth - DEFAULT_WIDTH - PANEL_MARGIN, y: PANEL_MARGIN })
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const dragging = useRef(false)
  const resizing = useRef<'right' | 'bottom' | 'corner' | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 })

  // Load saved position and size on mount
  useEffect(() => {
    const handler = (data: unknown) => {
      const msg = data as Record<string, unknown>
      if (msg.type === 'agentListPanelPosLoaded' && msg.pos) {
        setPos(msg.pos as { x: number; y: number })
      }
      if (msg.type === 'agentListPanelSizeLoaded' && msg.size) {
        setSize(msg.size as { width: number; height: number })
      }
    }
    window.electronAPI.on('message', handler)
    vscode.postMessage({ type: 'getAgentListPanelPos' })
    vscode.postMessage({ type: 'getAgentListPanelSize' })
    return () => window.electronAPI.removeListener('message', handler)
  }, [])

  // Title bar drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  // Resize edge detection
  const handleResizeDown = useCallback((edge: 'right' | 'bottom' | 'corner', e: React.MouseEvent) => {
    resizing.current = edge
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, width: size.width, height: size.height }
    e.preventDefault()
    e.stopPropagation()
  }, [size])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
      } else if (resizing.current) {
        const dx = e.clientX - resizeStart.current.mouseX
        const dy = e.clientY - resizeStart.current.mouseY
        setSize((prev) => {
          const w = resizing.current === 'bottom' ? prev.width : Math.max(MIN_WIDTH, resizeStart.current.width + dx)
          const h = resizing.current === 'right' ? prev.height : Math.max(MIN_HEIGHT, resizeStart.current.height + dy)
          return { width: w, height: h }
        })
      }
    }
    const handleMouseUp = () => {
      if (dragging.current) {
        dragging.current = false
        setPos((current) => {
          vscode.postMessage({ type: 'setAgentListPanelPos', pos: current })
          return current
        })
      }
      if (resizing.current) {
        resizing.current = null
        setSize((current) => {
          vscode.postMessage({ type: 'setAgentListPanelSize', size: current })
          return current
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
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

  // Build sub-agent lookup: parentAgentId → SubagentCharacter[]
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

  if (agents.length === 0 && remotePeers.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: pos.y,
        left: pos.x,
        zIndex: 45,
        background: 'rgba(30, 30, 46, 0.85)',
        border: '2px solid var(--pixel-border)',
        borderRadius: 0,
        padding: '4px 0',
        boxShadow: 'var(--pixel-shadow)',
        width: size.width,
        height: size.height,
        overflow: 'hidden',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Title bar — draggable */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          fontSize: fs(20),
          color: 'rgba(255, 255, 255, 0.5)',
          padding: '2px 10px 4px',
          borderBottom: '1px solid var(--pixel-border)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        Agents
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {[...grouped.entries()].map(([projectKey, agentList]) => (
          <div key={projectKey}>
            {/* Project header */}
            <div style={{
              fontSize: fs(18),
              color: 'var(--pixel-green)',
              padding: '6px 10px 2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {projectDisplayName(projectKey)}
            </div>

            {/* Agents in this project */}
            {agentList.map(({ id, meta }) => {
              const statusInfo = getStatusInfo(id, agentStatuses, agentTools)
              const subs = subsByParent.get(id)

              return (
                <div key={id}>
                  {/* Main agent row */}
                  <div
                    onClick={(e) => onAgentClick?.(id, meta.label, { x: e.clientX, y: e.clientY })}
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 10px 2px 18px',
                    fontSize: fs(18),
                    cursor: onAgentClick ? 'pointer' : undefined,
                  }}>
                    <span
                      className={statusInfo.isPermission ? 'pixel-agents-pulse' : undefined}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: statusInfo.color, flexShrink: 0,
                      }}
                    />
                    <span style={{
                      color: statusInfo.isPermission ? '#ff8888' : 'rgba(255, 255, 255, 0.8)',
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {meta.label}
                    </span>
                    <span style={{
                      fontSize: fs(14), color: statusInfo.color, flexShrink: 0,
                      maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* Sub-agents */}
                  {subs && subs.map((sub) => {
                    const subTools = subagentTools[id]?.[sub.parentToolId]
                    const activeSub = subTools?.find((t) => !t.done)
                    const subStatus = activeSub?.status || 'Running'
                    return (
                      <div key={sub.id} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '1px 10px 1px 30px', fontSize: fs(14),
                        color: 'rgba(255, 255, 255, 0.55)',
                      }}>
                        <span style={{ flexShrink: 0 }}>└</span>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--vscode-charts-blue, #3794ff)', flexShrink: 0,
                        }} />
                        <span style={{
                          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {sub.label}
                        </span>
                        <span style={{
                          flexShrink: 0, maxWidth: 80,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {subStatus}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}

        {/* Remote peer groups */}
        {remotePeers.map((peer) => (
          <div key={peer.peerId}>
            <div style={{
              fontSize: fs(18),
              color: 'rgba(130, 180, 255, 0.8)',
              padding: '6px 10px 2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              borderTop: '1px solid var(--pixel-border)',
              marginTop: 4,
            }}>
              {peer.name}
            </div>
            {peer.agents.map((ra) => {
              const statusColor = ra.status === 'rate_limited' ? '#e55'
                : ra.status === 'waiting' ? 'var(--vscode-charts-yellow, #cca700)'
                : 'var(--vscode-charts-blue, #3794ff)'
              const statusText = ra.currentTool || (ra.status === 'rate_limited' ? 'Rest' : ra.status === 'waiting' ? 'Waiting' : 'Active')
              const remoteHistoryId = getRemoteAgentId(peer.peerId, ra.id)
              return (
                <div key={ra.id}>
                  <div
                    onClick={(e) => onAgentClick?.(remoteHistoryId, ra.label, { x: e.clientX, y: e.clientY })}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '2px 10px 2px 18px', fontSize: fs(18),
                    cursor: onAgentClick ? 'pointer' : undefined,
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor, flexShrink: 0,
                    }} />
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {ra.label}
                    </span>
                    <span style={{
                      fontSize: fs(14), color: statusColor, flexShrink: 0,
                      maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {statusText}
                    </span>
                  </div>
                  {ra.subagents.map((sub, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '1px 10px 1px 30px', fontSize: fs(14),
                      color: 'rgba(255, 255, 255, 0.55)',
                    }}>
                      <span style={{ flexShrink: 0 }}>└</span>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--vscode-charts-blue, #3794ff)', flexShrink: 0,
                      }} />
                      <span style={{
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {sub.label}
                      </span>
                      {sub.currentTool && (
                        <span style={{
                          flexShrink: 0, maxWidth: 80,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {sub.currentTool}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Resize handles */}
      <div
        onMouseDown={(e) => handleResizeDown('right', e)}
        style={{
          position: 'absolute', top: 0, right: 0, width: RESIZE_HIT, height: '100%',
          cursor: 'col-resize',
        }}
      />
      <div
        onMouseDown={(e) => handleResizeDown('bottom', e)}
        style={{
          position: 'absolute', bottom: 0, left: 0, width: '100%', height: RESIZE_HIT,
          cursor: 'row-resize',
        }}
      />
      <div
        onMouseDown={(e) => handleResizeDown('corner', e)}
        style={{
          position: 'absolute', bottom: 0, right: 0, width: RESIZE_HIT * 2, height: RESIZE_HIT * 2,
          cursor: 'nwse-resize',
        }}
      />
    </div>
  )
}
