import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import type { AgentMeta } from '../hooks/useExtensionMessages.js'
import type { ToolActivity } from '../office/types.js'

interface AgentListPanelProps {
  agents: number[]
  agentMetas: Record<number, AgentMeta>
  agentStatuses: Record<number, string>
  agentTools: Record<number, ToolActivity[]>
}

/** Convert encoded dir name back to readable project name.
 *  e.g. "D--work-data-project-go-tt-info" → "tt-info"
 *  e.g. "d--work-data-project-go-cbc-go" → "cbc-go"
 */
function projectDisplayName(dirName: string): string {
  // Take last segment after splitting by common separators
  const parts = dirName.replace(/^[A-Za-z]--/, '').split('-')
  // Find a meaningful suffix: skip common prefixes like work, data, project
  const skip = new Set(['work', 'data', 'project', 'other', 'go', 'java', ''])
  let startIdx = 0
  for (let i = 0; i < parts.length; i++) {
    if (skip.has(parts[i].toLowerCase())) {
      startIdx = i + 1
    } else {
      break
    }
  }
  const meaningful = parts.slice(startIdx)
  return meaningful.length > 0 ? meaningful.join('-') : dirName
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

export function AgentListPanel({ agents, agentMetas, agentStatuses, agentTools }: AgentListPanelProps) {
  const [pos, setPos] = useState({ x: 8, y: 8 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
    }
    const handleMouseUp = () => { dragging.current = false }
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

  if (agents.length === 0) return null

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
        minWidth: 180,
        maxWidth: 260,
        maxHeight: 'calc(100vh - 80px)',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          fontSize: '20px',
          color: 'rgba(255, 255, 255, 0.5)',
          padding: '2px 10px 4px',
          borderBottom: '1px solid var(--pixel-border)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          cursor: 'grab',
          userSelect: 'none',
        }}
      >
        Agents
      </div>

      {[...grouped.entries()].map(([projectKey, agentList]) => (
        <div key={projectKey}>
          {/* Project header */}
          <div style={{
            fontSize: '18px',
            color: 'var(--pixel-green)',
            padding: '6px 10px 2px',
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {projectDisplayName(projectKey)}
          </div>

          {/* Agents in this project */}
          {agentList.map(({ id, meta }) => {
            const statusInfo = getStatusInfo(id, agentStatuses, agentTools)

            return (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 10px 2px 18px',
                  fontSize: '18px',
                }}
              >
                {/* Status dot */}
                <span
                  className={statusInfo.isPermission ? 'pixel-agents-pulse' : undefined}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: statusInfo.color,
                    flexShrink: 0,
                  }}
                />

                {/* Label */}
                <span style={{
                  color: statusInfo.isPermission ? '#ff8888' : 'rgba(255, 255, 255, 0.8)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {meta.label}
                </span>

                {/* Status text */}
                <span style={{
                  fontSize: '14px',
                  color: statusInfo.color,
                  flexShrink: 0,
                  maxWidth: 90,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {statusInfo.text}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
