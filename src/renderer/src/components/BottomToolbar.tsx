import { useState } from 'react'
import { SettingsModal } from './SettingsModal.js'

type ViewMode = 'office' | 'dashboard'
type DashboardLayout = 'grid' | 'list'

interface BottomToolbarProps {
  isEditMode: boolean
  onToggleEditMode: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
  viewMode: ViewMode
  onSetViewMode: (mode: ViewMode) => void
  dashboardLayout: DashboardLayout
  onSetDashboardLayout: (layout: DashboardLayout) => void
  fontScale: number
  onFontScaleChange: (scale: number) => void
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 10,
  left: 10,
  zIndex: 'var(--pixel-controls-z)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--pixel-bg)',
  border: '2px solid var(--pixel-border)',
  borderRadius: 0,
  padding: '4px 6px',
  boxShadow: 'var(--pixel-shadow)',
}

const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '24px',
  color: 'var(--pixel-text)',
  background: 'var(--pixel-btn-bg)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const btnActive: React.CSSProperties = {
  ...btnBase,
  background: 'var(--pixel-active-bg)',
  border: '2px solid var(--pixel-accent)',
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  hovered,
  setHovered,
}: {
  options: { value: T; label: string; title: string }[]
  value: T
  onChange: (v: T) => void
  hovered: string | null
  setHovered: (v: string | null) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {options.map((opt) => {
        const isActive = value === opt.value
        const hoverKey = `toggle-${opt.value}`
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            onMouseEnter={() => setHovered(hoverKey)}
            onMouseLeave={() => setHovered(null)}
            style={
              isActive
                ? { ...btnActive, fontSize: '20px', padding: '4px 8px' }
                : {
                    ...btnBase,
                    fontSize: '20px',
                    padding: '4px 8px',
                    background: hovered === hoverKey ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                  }
            }
            title={opt.title}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function BottomToolbar({
  isEditMode,
  onToggleEditMode,
  isDebugMode,
  onToggleDebugMode,
  viewMode,
  onSetViewMode,
  dashboardLayout,
  onSetDashboardLayout,
  fontScale,
  onFontScaleChange,
}: BottomToolbarProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div style={panelStyle}>
      {/* View mode toggle */}
      <ToggleGroup
        options={[
          { value: 'office' as ViewMode, label: 'Office', title: 'Office view (pixel art)' },
          { value: 'dashboard' as ViewMode, label: 'Dash', title: 'Dashboard view (text)' },
        ]}
        value={viewMode}
        onChange={onSetViewMode}
        hovered={hovered}
        setHovered={setHovered}
      />

      {/* Dashboard layout toggle — only in dashboard mode */}
      {viewMode === 'dashboard' && (
        <ToggleGroup
          options={[
            { value: 'grid' as DashboardLayout, label: 'Grid', title: 'Grid layout' },
            { value: 'list' as DashboardLayout, label: 'List', title: 'List layout' },
          ]}
          value={dashboardLayout}
          onChange={onSetDashboardLayout}
          hovered={hovered}
          setHovered={setHovered}
        />
      )}

      {/* Layout button — only in office mode */}
      {viewMode === 'office' && (
        <button
          onClick={onToggleEditMode}
          onMouseEnter={() => setHovered('edit')}
          onMouseLeave={() => setHovered(null)}
          style={
            isEditMode
              ? { ...btnActive }
              : {
                  ...btnBase,
                  background: hovered === 'edit' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                }
          }
          title="Edit office layout"
        >
          Layout
        </button>
      )}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsSettingsOpen((v) => !v)}
          onMouseEnter={() => setHovered('settings')}
          onMouseLeave={() => setHovered(null)}
          style={
            isSettingsOpen
              ? { ...btnActive }
              : {
                  ...btnBase,
                  background: hovered === 'settings' ? 'var(--pixel-btn-hover-bg)' : btnBase.background,
                }
          }
          title="Settings"
        >
          Settings
        </button>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDebugMode={isDebugMode}
          onToggleDebugMode={onToggleDebugMode}
          fontScale={fontScale}
          onFontScaleChange={onFontScaleChange}
        />
      </div>
    </div>
  )
}
