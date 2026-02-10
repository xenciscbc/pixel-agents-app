import { useState } from 'react'
import { SettingsModal } from './SettingsModal.js'

interface BottomToolbarProps {
  isEditMode: boolean
  onOpenClaude: () => void
  onToggleEditMode: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 10,
  left: 10,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'rgba(30, 30, 46, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
  padding: '4px 6px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
}

const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.8)',
  background: 'rgba(255, 255, 255, 0.08)',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
}

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: 'rgba(90, 140, 255, 0.25)',
  border: '1px solid rgba(90, 140, 255, 0.4)',
}

const gearBase: React.CSSProperties = {
  ...btnBase,
  padding: '5px 8px',
  fontSize: '14px',
  lineHeight: '14px',
}

export function BottomToolbar({
  isEditMode,
  onOpenClaude,
  onToggleEditMode,
  isDebugMode,
  onToggleDebugMode,
}: BottomToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div style={panelStyle}>
      <button
        onClick={onOpenClaude}
        onMouseEnter={() => setHovered('agent')}
        onMouseLeave={() => setHovered(null)}
        style={{
          ...btnBase,
          padding: '5px 12px',
          background:
            hovered === 'agent'
              ? 'rgba(90, 200, 140, 0.3)'
              : 'rgba(90, 200, 140, 0.15)',
          border: '1px solid rgba(90, 200, 140, 0.35)',
          color: 'rgba(200, 255, 220, 0.95)',
        }}
      >
        + Agent
      </button>
      <button
        onClick={onToggleEditMode}
        onMouseEnter={() => setHovered('edit')}
        onMouseLeave={() => setHovered(null)}
        style={
          isEditMode
            ? { ...btnActive }
            : {
                ...btnBase,
                background: hovered === 'edit' ? 'rgba(255, 255, 255, 0.15)' : btnBase.background,
              }
        }
        title="Edit office layout"
      >
        Layout
      </button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsSettingsOpen((v) => !v)}
          onMouseEnter={() => setHovered('gear')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...gearBase,
            background:
              isSettingsOpen
                ? 'rgba(90, 140, 255, 0.25)'
                : hovered === 'gear'
                  ? 'rgba(255, 255, 255, 0.15)'
                  : gearBase.background,
            border: isSettingsOpen ? '1px solid rgba(90, 140, 255, 0.4)' : 'none',
          }}
          title="Settings"
        >
          {'\u2699'}
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={onToggleDebugMode}
        />
      </div>
    </div>
  )
}
