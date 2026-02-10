import { useState, useEffect, useRef } from 'react'

interface ZoomControlsProps {
  zoom: number
  onZoomChange: (zoom: number) => void
}

const btnBase: React.CSSProperties = {
  width: 26,
  height: 26,
  fontSize: '16px',
  lineHeight: '16px',
  padding: 0,
  background: 'rgba(30, 30, 46, 0.85)',
  color: 'rgba(255, 255, 255, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
}

export function ZoomControls({ zoom, onZoomChange }: ZoomControlsProps) {
  const [hovered, setHovered] = useState<'minus' | 'plus' | null>(null)
  const [showLevel, setShowLevel] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevZoomRef = useRef(zoom)

  const minDisabled = zoom <= 1
  const maxDisabled = zoom >= 10

  // Show zoom level briefly when zoom changes
  useEffect(() => {
    if (zoom === prevZoomRef.current) return
    prevZoomRef.current = zoom

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)

    setShowLevel(true)
    setFadeOut(false)

    // Start fade after 1.5s
    fadeTimerRef.current = setTimeout(() => {
      setFadeOut(true)
    }, 1500)

    // Hide completely after 2s
    timerRef.current = setTimeout(() => {
      setShowLevel(false)
      setFadeOut(false)
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    }
  }, [zoom])

  return (
    <>
      {/* Zoom level indicator at top-center */}
      {showLevel && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(30, 30, 46, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '4px 12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.8)',
            userSelect: 'none',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.5s ease-out',
            pointerEvents: 'none',
          }}
        >
          {zoom}x
        </div>
      )}

      {/* Vertically stacked round buttons — top-left */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <button
          onClick={() => onZoomChange(zoom + 1)}
          disabled={maxDisabled}
          onMouseEnter={() => setHovered('plus')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...btnBase,
            background: hovered === 'plus' && !maxDisabled ? 'rgba(255, 255, 255, 0.15)' : btnBase.background,
            cursor: maxDisabled ? 'default' : 'pointer',
            opacity: maxDisabled ? 0.3 : 1,
          }}
          title="Zoom in (Ctrl+Scroll)"
        >
          +
        </button>
        <button
          onClick={() => onZoomChange(zoom - 1)}
          disabled={minDisabled}
          onMouseEnter={() => setHovered('minus')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...btnBase,
            background: hovered === 'minus' && !minDisabled ? 'rgba(255, 255, 255, 0.15)' : btnBase.background,
            cursor: minDisabled ? 'default' : 'pointer',
            opacity: minDisabled ? 0.3 : 1,
          }}
          title="Zoom out (Ctrl+Scroll)"
        >
          -
        </button>
      </div>
    </>
  )
}
