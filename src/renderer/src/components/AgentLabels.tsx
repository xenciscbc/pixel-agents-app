import { useState, useEffect } from 'react'
import type { OfficeState } from '../office/engine/officeState.js'
import type { SubagentCharacter, AgentMeta } from '../hooks/useExtensionMessages.js'
import type { ToolActivity } from '../office/types.js'
import { TILE_SIZE, CharacterState } from '../office/types.js'

interface AgentLabelsProps {
  officeState: OfficeState
  agents: number[]
  agentMetas: Record<number, AgentMeta>
  agentStatuses: Record<number, string>
  agentTools: Record<number, ToolActivity[]>
  containerRef: React.RefObject<HTMLDivElement | null>
  zoom: number
  panRef: React.RefObject<{ x: number; y: number }>
  subagentCharacters: SubagentCharacter[]
}

function getStatusText(
  agentId: number,
  agentStatuses: Record<number, string>,
  agentTools: Record<number, ToolActivity[]>,
  isActive: boolean,
): string {
  const status = agentStatuses[agentId]
  if (status === 'waiting') return 'Waiting'

  const tools = agentTools[agentId]
  if (tools && tools.length > 0) {
    const activeTool = [...tools].reverse().find((t) => !t.done)
    if (activeTool) {
      if (activeTool.permissionWait) return 'Needs approval'
      return activeTool.status
    }
    if (isActive) {
      const lastTool = tools[tools.length - 1]
      if (lastTool) return lastTool.status
    }
  }

  if (isActive) return 'Active'
  return 'Idle'
}

export function AgentLabels({
  officeState,
  agents,
  agentMetas,
  agentStatuses,
  agentTools,
  containerRef,
  zoom,
  panRef,
  subagentCharacters,
}: AgentLabelsProps) {
  const [, setTick] = useState(0)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      setTick((n) => n + 1)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const el = containerRef.current
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const canvasW = Math.round(rect.width * dpr)
  const canvasH = Math.round(rect.height * dpr)
  const layout = officeState.getLayout()
  const mapW = layout.cols * TILE_SIZE * zoom
  const mapH = layout.rows * TILE_SIZE * zoom
  const deviceOffsetX = Math.floor((canvasW - mapW) / 2) + Math.round(panRef.current.x)
  const deviceOffsetY = Math.floor((canvasH - mapH) / 2) + Math.round(panRef.current.y)

  // Build sub-agent label lookup
  const subLabelMap = new Map<number, string>()
  for (const sub of subagentCharacters) {
    subLabelMap.set(sub.id, sub.label)
  }

  const allIds = [...agents, ...subagentCharacters.map((s) => s.id)]

  return (
    <>
      {allIds.map((id) => {
        const ch = officeState.characters.get(id)
        if (!ch) return null

        const sittingOffset = ch.state === CharacterState.TYPE ? 6 : 0
        const screenX = (deviceOffsetX + ch.x * zoom) / dpr
        const screenY = (deviceOffsetY + (ch.y + sittingOffset - 24) * zoom) / dpr
        const charW = (16 * zoom) / dpr
        const charH = (24 * zoom) / dpr

        const isSub = ch.isSubagent
        const meta = agentMetas[id]
        const labelText = subLabelMap.get(id) || meta?.label || `Agent #${id}`
        const statusText = isSub
          ? (subLabelMap.get(id) || 'Subtask')
          : getStatusText(id, agentStatuses, agentTools, ch.isActive)

        const isHovered = hoveredId === id

        return (
          <div key={id}>
            {/* Invisible hover area over the character */}
            <div
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'absolute',
                left: screenX - charW / 2,
                top: screenY - 20,
                width: charW,
                height: charH + 20,
                zIndex: 39,
                cursor: 'pointer',
              }}
            />

            {/* Tooltip (only on hover) */}
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  left: screenX,
                  top: screenY - 24,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  zIndex: 41,
                }}
              >
                <span
                  style={{
                    fontSize: isSub ? '16px' : '18px',
                    fontStyle: isSub ? 'italic' : undefined,
                    color: 'var(--vscode-foreground)',
                    background: 'rgba(30,30,46,0.85)',
                    padding: '2px 6px',
                    borderRadius: 2,
                    border: '1px solid var(--pixel-border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {labelText}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(30,30,46,0.85)',
                    padding: '1px 5px',
                    borderRadius: 2,
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  {statusText}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
