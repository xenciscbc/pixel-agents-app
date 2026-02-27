import { useEffect, useRef } from 'react'

interface StatusHistoryPopupProps {
  agentId: number
  agentLabel: string
  history: string[]
  position: { x: number; y: number }
  fontScale: number
  onClose: () => void
}

export function StatusHistoryPopup({ agentLabel, history, position, fontScale, onClose }: StatusHistoryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to prevent the same click from closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [onClose])

  const fs = (base: number) => `${Math.round(base * fontScale)}px`

  // Clamp position to viewport
  const popupWidth = 260
  const popupMaxHeight = 300
  const x = Math.min(position.x, window.innerWidth - popupWidth - 10)
  const y = Math.min(position.y, window.innerHeight - popupMaxHeight - 10)

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 100,
        background: 'var(--pixel-bg)',
        border: '2px solid var(--pixel-border)',
        borderRadius: 0,
        boxShadow: 'var(--pixel-shadow)',
        minWidth: 200,
        maxWidth: popupWidth,
        maxHeight: popupMaxHeight,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          borderBottom: '1px solid var(--pixel-border)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <span style={{ fontSize: fs(18), color: 'rgba(255, 255, 255, 0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agentLabel}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: fs(18),
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
          }}
        >
          X
        </button>
      </div>

      {/* History list */}
      <div style={{ overflowY: 'auto', padding: '4px 8px', flex: 1 }}>
        {history.length === 0 ? (
          <div style={{ fontSize: fs(14), color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', padding: '8px 0' }}>
            No activity yet
          </div>
        ) : (
          history.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: fs(14),
                color: i === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.55)',
                padding: '2px 0',
                borderBottom: i < history.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
