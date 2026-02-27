import { useState, useEffect, useCallback } from 'react'
import { vscode } from '../vscodeApi.js'
import type { SoundSettings } from '../hooks/useExtensionMessages.js'
/** Mirrors WatchDir from src/main/settingsStore.ts */
interface WatchDir {
  type: 'claude-root' | 'project'
  path: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDebugMode: boolean
  onToggleDebugMode: () => void
  fontScale: number
  onFontScaleChange: (scale: number) => void
  alwaysOnTop: boolean
  onAlwaysOnTopChange: (value: boolean) => void
  peerName: string
  onPeerNameChange: (name: string) => void
  broadcastEnabled: boolean
  onBroadcastEnabledChange: (value: boolean) => void
  udpPort: number
  onUdpPortChange: (port: number) => void
  heartbeatInterval: number
  onHeartbeatIntervalChange: (seconds: number) => void
  soundSettings: SoundSettings
  onSoundSettingsChange: (settings: SoundSettings) => void
}

const menuItemBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '6px 10px',
  fontSize: '24px',
  color: 'rgba(255, 255, 255, 0.8)',
  background: 'transparent',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '20px',
  color: 'rgba(255, 255, 255, 0.5)',
  padding: '8px 10px 2px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
}

const dirItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 10px',
  fontSize: '20px',
  color: 'rgba(255, 255, 255, 0.7)',
}

const smallBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255, 100, 100, 0.7)',
  cursor: 'pointer',
  fontSize: '20px',
  padding: '0 4px',
}

export function SettingsModal({ isOpen, onClose, isDebugMode, onToggleDebugMode, fontScale, onFontScaleChange, alwaysOnTop, onAlwaysOnTopChange, peerName, onPeerNameChange, broadcastEnabled, onBroadcastEnabledChange, udpPort, onUdpPortChange, heartbeatInterval, onHeartbeatIntervalChange, soundSettings, onSoundSettingsChange }: SettingsModalProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [watchDirs, setWatchDirs] = useState<WatchDir[]>([])
  const [threshold, setThreshold] = useState(30)
  const [scanInterval, setScanIntervalLocal] = useState(30)

  // Listen for watchDirsLoaded and projectDirSelected messages
  useEffect(() => {
    if (!isOpen) return

    const handler = (data: unknown) => {
      const msg = data as Record<string, unknown>
      if (msg.type === 'watchDirsLoaded') {
        setWatchDirs(msg.dirs as WatchDir[])
        setThreshold(msg.threshold as number)
        if (typeof msg.scanInterval === 'number') setScanIntervalLocal(msg.scanInterval as number)
      } else if (msg.type === 'projectDirSelected') {
        const selectedPath = msg.path as string
        vscode.postMessage({ type: 'addWatchDir', dir: { type: 'project', path: selectedPath } })
      }
    }

    window.electronAPI.on('message', handler)
    // Request current settings
    vscode.postMessage({ type: 'getWatchDirs' })

    return () => window.electronAPI.removeListener('message', handler)
  }, [isOpen])

  const handleAddClaudeRoot = useCallback(() => {
    vscode.postMessage({ type: 'addWatchDir', dir: { type: 'claude-root', path: '~/.claude/projects' } })
  }, [])

  const handleAddProject = useCallback(() => {
    vscode.postMessage({ type: 'selectProjectDir' })
  }, [])

  const handleRemoveDir = useCallback((index: number) => {
    vscode.postMessage({ type: 'removeWatchDir', index })
  }, [])

  const handleThresholdChange = useCallback((value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      setThreshold(num)
      vscode.postMessage({ type: 'setActiveThreshold', minutes: num })
    }
  }, [])

  const handleScanIntervalChange = useCallback((value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 5) {
      setScanIntervalLocal(num)
      vscode.postMessage({ type: 'setScanInterval', seconds: num })
    }
  }, [])

  if (!isOpen) return null

  return (
    <>
      {/* Dark backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 49,
        }}
      />
      {/* Centered modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 50,
          background: 'var(--pixel-bg)',
          border: '2px solid var(--pixel-border)',
          borderRadius: 0,
          padding: '4px',
          boxShadow: 'var(--pixel-shadow)',
          minWidth: 320,
          maxWidth: 500,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px',
            borderBottom: '1px solid var(--pixel-border)',
            marginBottom: '4px',
          }}
        >
          <span style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>Settings</span>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovered('close')}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === 'close' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              borderRadius: 0,
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            X
          </button>
        </div>

        {/* Watch Directories Section */}
        <div style={sectionLabelStyle}>Watch Directories</div>
        <div style={{ padding: '0 4px 4px' }}>
          {watchDirs.length === 0 && (
            <div style={{ ...dirItemStyle, color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic' }}>
              No directories configured
            </div>
          )}
          {watchDirs.map((dir, i) => (
            <div key={`${dir.type}-${dir.path}`} style={dirItemStyle}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                <span style={{ color: 'rgba(90, 200, 140, 0.8)', marginRight: 6 }}>
                  {dir.type === 'claude-root' ? '[ROOT]' : '[PRJ]'}
                </span>
                {dir.path}
              </span>
              <button
                onClick={() => handleRemoveDir(i)}
                onMouseEnter={() => setHovered(`rm-${i}`)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...smallBtnStyle,
                  color: hovered === `rm-${i}` ? '#e55' : 'rgba(255, 100, 100, 0.5)',
                }}
              >
                X
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, padding: '4px 10px' }}>
            <button
              onClick={handleAddClaudeRoot}
              onMouseEnter={() => setHovered('addRoot')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...menuItemBase,
                fontSize: '20px',
                padding: '4px 8px',
                justifyContent: 'center',
                border: '1px solid var(--pixel-border)',
                background: hovered === 'addRoot' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
            >
              + Claude Root
            </button>
            <button
              onClick={handleAddProject}
              onMouseEnter={() => setHovered('addProj')}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...menuItemBase,
                fontSize: '20px',
                padding: '4px 8px',
                justifyContent: 'center',
                border: '1px solid var(--pixel-border)',
                background: hovered === 'addProj' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              }}
            >
              + Project
            </button>
          </div>
        </div>

        {/* Active Threshold */}
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>Active Threshold</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              style={{
                width: 50,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--pixel-border)',
                borderRadius: 0,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '20px',
                padding: '2px 4px',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            />
            <span style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>min</span>
          </div>
        </div>

        {/* Scan Interval */}
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>Scan Interval</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              min={5}
              value={scanInterval}
              onChange={(e) => handleScanIntervalChange(e.target.value)}
              style={{
                width: 50,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--pixel-border)',
                borderRadius: 0,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '20px',
                padding: '2px 4px',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            />
            <span style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>sec</span>
          </div>
        </div>

        {/* Font Scale */}
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>Font Scale</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={fontScale}
              onChange={(e) => onFontScaleChange(parseFloat(e.target.value))}
              style={{ width: 80, accentColor: 'rgba(90, 140, 255, 0.8)' }}
            />
            <span style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.8)', minWidth: 40, textAlign: 'right' }}>
              {fontScale.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Window Section */}
        <div style={sectionLabelStyle}>Window</div>
        <button
          onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}
          onMouseEnter={() => setHovered('aot')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'aot' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          <span>Always on Top</span>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 0,
              background: alwaysOnTop ? 'rgba(90, 140, 255, 0.8)' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              lineHeight: 1,
              color: '#fff',
            }}
          >
            {alwaysOnTop ? 'X' : ''}
          </span>
        </button>

        {/* Network Section */}
        <div style={sectionLabelStyle}>Network</div>
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>Peer Name</span>
          <input
            type="text"
            value={peerName}
            onChange={(e) => onPeerNameChange(e.target.value)}
            style={{
              width: 120,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--pixel-border)',
              borderRadius: 0,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '20px',
              padding: '2px 4px',
              textAlign: 'right',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          onClick={() => onBroadcastEnabledChange(!broadcastEnabled)}
          onMouseEnter={() => setHovered('broadcast')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'broadcast' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          <span>Broadcast</span>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 0,
              background: broadcastEnabled ? 'rgba(90, 140, 255, 0.8)' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              lineHeight: 1,
              color: '#fff',
            }}
          >
            {broadcastEnabled ? 'X' : ''}
          </span>
        </button>
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>UDP Port</span>
          <input
            type="number"
            min={1024}
            max={65535}
            value={udpPort}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10)
              if (!isNaN(num) && num >= 1024 && num <= 65535) onUdpPortChange(num)
            }}
            style={{
              width: 70,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--pixel-border)',
              borderRadius: 0,
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '20px',
              padding: '2px 4px',
              textAlign: 'center',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ ...dirItemStyle, padding: '4px 10px' }}>
          <span style={{ fontSize: '22px' }}>Heartbeat Interval</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="number"
              min={1}
              value={heartbeatInterval}
              onChange={(e) => {
                const num = parseInt(e.target.value, 10)
                if (!isNaN(num) && num >= 1) onHeartbeatIntervalChange(num)
              }}
              style={{
                width: 50,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--pixel-border)',
                borderRadius: 0,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '20px',
                padding: '2px 4px',
                textAlign: 'center',
                fontFamily: 'inherit',
              }}
            />
            <span style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.5)' }}>sec</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--pixel-border)', margin: '4px 0' }} />

        <button
          onClick={() => {
            vscode.postMessage({ type: 'exportLayout' })
            onClose()
          }}
          onMouseEnter={() => setHovered('export')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'export' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          Export Layout
        </button>
        <button
          onClick={() => {
            vscode.postMessage({ type: 'importLayout' })
            onClose()
          }}
          onMouseEnter={() => setHovered('import')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'import' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          Import Layout
        </button>
        {/* Sound Section */}
        <div style={sectionLabelStyle}>Sound</div>
        {([
          { key: 'enabled' as const, label: 'Enable Sound' },
          { key: 'waiting' as const, label: 'Waiting' },
          { key: 'rest' as const, label: 'Rest' },
          { key: 'needsApproval' as const, label: 'Needs Approval' },
          { key: 'idle' as const, label: 'Idle' },
        ] as const).map(({ key, label }) => {
          const isChild = key !== 'enabled'
          const disabled = isChild && !soundSettings.enabled
          return (
            <button
              key={key}
              onClick={() => {
                if (disabled) return
                const next = { ...soundSettings, [key]: !soundSettings[key] }
                onSoundSettingsChange(next)
              }}
              onMouseEnter={() => setHovered(`sound-${key}`)}
              onMouseLeave={() => setHovered(null)}
              style={{
                ...menuItemBase,
                paddingLeft: isChild ? 30 : 10,
                background: hovered === `sound-${key}` && !disabled ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              <span>{label}</span>
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 0,
                  background: soundSettings[key] ? 'rgba(90, 140, 255, 0.8)' : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  lineHeight: 1,
                  color: '#fff',
                }}
              >
                {soundSettings[key] ? 'X' : ''}
              </span>
            </button>
          )
        })}
        <button
          onClick={onToggleDebugMode}
          onMouseEnter={() => setHovered('debug')}
          onMouseLeave={() => setHovered(null)}
          style={{
            ...menuItemBase,
            background: hovered === 'debug' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
          }}
        >
          <span>Debug View</span>
          {isDebugMode && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'rgba(90, 140, 255, 0.8)',
                flexShrink: 0,
              }}
            />
          )}
        </button>
      </div>
    </>
  )
}
