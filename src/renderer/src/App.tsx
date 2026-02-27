import { useState, useCallback, useRef, useEffect } from 'react'
import { OfficeState } from './office/engine/officeState.js'
import { OfficeCanvas } from './office/components/OfficeCanvas.js'
import { ToolOverlay } from './office/components/ToolOverlay.js'
import { AgentLabels } from './components/AgentLabels.js'
import { AgentListPanel } from './components/AgentListPanel.js'
import { DashboardView } from './components/DashboardView.js'
import { EditorToolbar } from './office/editor/EditorToolbar.js'
import { EditorState } from './office/editor/editorState.js'
import { EditTool } from './office/types.js'
import { isRotatable } from './office/layout/furnitureCatalog.js'
import { vscode } from './vscodeApi.js'
import { useExtensionMessages } from './hooks/useExtensionMessages.js'
import { PULSE_ANIMATION_DURATION_SEC } from './constants.js'
import { useEditorActions } from './hooks/useEditorActions.js'
import { useEditorKeyboard } from './hooks/useEditorKeyboard.js'
import { ZoomControls } from './components/ZoomControls.js'
import { BottomToolbar } from './components/BottomToolbar.js'
import { StatusHistoryPopup } from './components/StatusHistoryPopup.js'
import { DebugView } from './components/DebugView.js'

type ViewMode = 'office' | 'dashboard'
type DashboardLayout = 'grid' | 'list'

// Game state lives outside React — updated imperatively by message handlers
const officeStateRef = { current: null as OfficeState | null }
const editorState = new EditorState()

function getOfficeState(): OfficeState {
  if (!officeStateRef.current) {
    officeStateRef.current = new OfficeState()
  }
  return officeStateRef.current
}

const actionBarBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '22px',
  background: 'var(--pixel-btn-bg)',
  color: 'var(--pixel-text-dim)',
  border: '2px solid transparent',
  borderRadius: 0,
  cursor: 'pointer',
}

const actionBarBtnDisabled: React.CSSProperties = {
  ...actionBarBtnStyle,
  opacity: 'var(--pixel-btn-disabled-opacity)',
  cursor: 'default',
}

function EditActionBar({ editor, editorState: es }: { editor: ReturnType<typeof useEditorActions>; editorState: EditorState }) {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const undoDisabled = es.undoStack.length === 0
  const redoDisabled = es.redoStack.length === 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--pixel-controls-z)',
        display: 'flex',
        gap: 4,
        alignItems: 'center',
        background: 'var(--pixel-bg)',
        border: '2px solid var(--pixel-border)',
        borderRadius: 0,
        padding: '4px 8px',
        boxShadow: 'var(--pixel-shadow)',
      }}
    >
      <button
        style={undoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={undoDisabled ? undefined : editor.handleUndo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        style={redoDisabled ? actionBarBtnDisabled : actionBarBtnStyle}
        onClick={redoDisabled ? undefined : editor.handleRedo}
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>
      <button
        style={actionBarBtnStyle}
        onClick={editor.handleSave}
        title="Save layout"
      >
        Save
      </button>
      {!showResetConfirm ? (
        <button
          style={actionBarBtnStyle}
          onClick={() => setShowResetConfirm(true)}
          title="Reset to last saved layout"
        >
          Reset
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: '22px', color: 'var(--pixel-reset-text)' }}>Reset?</span>
          <button
            style={{ ...actionBarBtnStyle, background: 'var(--pixel-danger-bg)', color: '#fff' }}
            onClick={() => { setShowResetConfirm(false); editor.handleReset() }}
          >
            Yes
          </button>
          <button
            style={actionBarBtnStyle}
            onClick={() => setShowResetConfirm(false)}
          >
            No
          </button>
        </div>
      )}
    </div>
  )
}

function App() {
  const editor = useEditorActions(getOfficeState, editorState)

  const isEditDirty = useCallback(() => editor.isEditMode && editor.isDirty, [editor.isEditMode, editor.isDirty])

  const { agents, agentMetas, selectedAgent, agentTools, agentStatuses, subagentTools, subagentCharacters, fontScale, alwaysOnTop, peerName, broadcastEnabled, udpPort, heartbeatInterval, remotePeers, soundSettings, statusHistory, layoutReady, loadedAssets } = useExtensionMessages(getOfficeState, editor.setLastSavedLayout, isEditDirty)

  const [isDebugMode, setIsDebugMode] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('office')
  const [dashboardLayout, setDashboardLayout] = useState<DashboardLayout>('grid')

  // Load viewMode/dashboardLayout from main process
  useEffect(() => {
    const handler = (data: unknown) => {
      const msg = data as Record<string, unknown>
      if (msg.type === 'viewModeSettingsLoaded') {
        if (msg.viewMode) setViewMode(msg.viewMode as ViewMode)
        if (msg.dashboardLayout) setDashboardLayout(msg.dashboardLayout as DashboardLayout)
      }
    }
    window.electronAPI.on('message', handler)
    return () => window.electronAPI.removeListener('message', handler)
  }, [])

  const handleSetViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    vscode.postMessage({ type: 'setViewMode', mode })
  }, [])

  const handleSetDashboardLayout = useCallback((layout: DashboardLayout) => {
    setDashboardLayout(layout)
    vscode.postMessage({ type: 'setDashboardLayout', layout })
  }, [])

  const handleToggleDebugMode = useCallback(() => setIsDebugMode((prev) => !prev), [])

  const handleSetFontScale = useCallback((scale: number) => {
    vscode.postMessage({ type: 'setFontScale', scale })
  }, [])

  const handleSetAlwaysOnTop = useCallback((value: boolean) => {
    vscode.postMessage({ type: 'setAlwaysOnTop', value })
  }, [])

  const handleSetPeerName = useCallback((name: string) => {
    vscode.postMessage({ type: 'setPeerName', name })
  }, [])

  const handleSetBroadcastEnabled = useCallback((enabled: boolean) => {
    vscode.postMessage({ type: 'setBroadcastEnabled', enabled })
  }, [])

  const handleSetUdpPort = useCallback((port: number) => {
    vscode.postMessage({ type: 'setUdpPort', port })
  }, [])

  const handleSetHeartbeatInterval = useCallback((seconds: number) => {
    vscode.postMessage({ type: 'setHeartbeatInterval', seconds })
  }, [])

  const handleSetSoundSettings = useCallback((settings: import('./hooks/useExtensionMessages.js').SoundSettings) => {
    vscode.postMessage({ type: 'setSoundSettings', settings })
  }, [])

  const [historyPopup, setHistoryPopup] = useState<{ agentId: number; label: string; position: { x: number; y: number } } | null>(null)

  const handleAgentClick = useCallback((agentId: number, label: string, position: { x: number; y: number }) => {
    setHistoryPopup({ agentId, label, position })
  }, [])

  const handleClosePopup = useCallback(() => {
    setHistoryPopup(null)
  }, [])

  const handleSelectAgent = useCallback((id: number) => {
    vscode.postMessage({ type: 'focusAgent', id })
  }, [])

  // Sync remote peers to officeState for Office View
  const prevRemotePeersRef = useRef<typeof remotePeers>([])
  useEffect(() => {
    const os = getOfficeState()
    const prevPeers = prevRemotePeersRef.current

    // Build previous remote agent ID set
    const prevIds = new Set<number>()
    for (const peer of prevPeers) {
      const hash = Array.from(peer.peerId).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      for (const ra of peer.agents) {
        prevIds.add(-(hash * 1000 + ra.id))
      }
    }

    // Build current remote agent ID set
    const currIds = new Set<number>()
    for (const peer of remotePeers) {
      const hash = Array.from(peer.peerId).reduce((acc, c) => acc + c.charCodeAt(0), 0)
      for (const ra of peer.agents) {
        currIds.add(-(hash * 1000 + ra.id))
      }
    }

    // Add new remote agents
    for (const id of currIds) {
      if (!prevIds.has(id)) {
        os.addAgent(id)
      }
    }

    // Remove gone remote agents
    for (const id of prevIds) {
      if (!currIds.has(id)) {
        os.removeAgent(id)
      }
    }

    prevRemotePeersRef.current = remotePeers
  }, [remotePeers])

  const containerRef = useRef<HTMLDivElement>(null)

  const [editorTickForKeyboard, setEditorTickForKeyboard] = useState(0)
  useEditorKeyboard(
    editor.isEditMode,
    editorState,
    editor.handleDeleteSelected,
    editor.handleRotateSelected,
    editor.handleToggleState,
    editor.handleUndo,
    editor.handleRedo,
    useCallback(() => setEditorTickForKeyboard((n) => n + 1), []),
    editor.handleToggleEditMode,
  )

  const handleCloseAgent = useCallback((id: number) => {
    vscode.postMessage({ type: 'closeAgent', id })
  }, [])

  const handleClick = useCallback((agentId: number) => {
    // If clicked agent is a sub-agent, focus the parent's terminal instead
    const os = getOfficeState()
    const meta = os.subagentMeta.get(agentId)
    const focusId = meta ? meta.parentAgentId : agentId
    vscode.postMessage({ type: 'focusAgent', id: focusId })
  }, [])

  const officeState = getOfficeState()

  // Force dependency on editorTickForKeyboard to propagate keyboard-triggered re-renders
  void editorTickForKeyboard

  // Show "Press R to rotate" hint when a rotatable item is selected or being placed
  const showRotateHint = editor.isEditMode && (() => {
    if (editorState.selectedFurnitureUid) {
      const item = officeState.getLayout().furniture.find((f) => f.uid === editorState.selectedFurnitureUid)
      if (item && isRotatable(item.type)) return true
    }
    if (editorState.activeTool === EditTool.FURNITURE_PLACE && isRotatable(editorState.selectedFurnitureType)) {
      return true
    }
    return false
  })()

  if (!layoutReady) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vscode-foreground)' }}>
        Loading...
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes pixel-agents-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .pixel-agents-pulse { animation: pixel-agents-pulse ${PULSE_ANIMATION_DURATION_SEC}s ease-in-out infinite; }
      `}</style>

      {viewMode === 'office' && (
        <>
          <OfficeCanvas
            officeState={officeState}
            onClick={handleClick}
            isEditMode={editor.isEditMode}
            editorState={editorState}
            onEditorTileAction={editor.handleEditorTileAction}
            onEditorEraseAction={editor.handleEditorEraseAction}
            onEditorSelectionChange={editor.handleEditorSelectionChange}
            onDeleteSelected={editor.handleDeleteSelected}
            onRotateSelected={editor.handleRotateSelected}
            onDragMove={editor.handleDragMove}
            editorTick={editor.editorTick}
            zoom={editor.zoom}
            onZoomChange={editor.handleZoomChange}
            panRef={editor.panRef}
          />

          <ZoomControls zoom={editor.zoom} onZoomChange={editor.handleZoomChange} />

          {/* Vignette overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--pixel-vignette)',
              pointerEvents: 'none',
              zIndex: 40,
            }}
          />

          {editor.isEditMode && editor.isDirty && (
            <EditActionBar editor={editor} editorState={editorState} />
          )}

          {showRotateHint && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: editor.isDirty ? 'translateX(calc(-50% + 100px))' : 'translateX(-50%)',
                zIndex: 49,
                background: 'var(--pixel-hint-bg)',
                color: '#fff',
                fontSize: '20px',
                padding: '3px 8px',
                borderRadius: 0,
                border: '2px solid var(--pixel-accent)',
                boxShadow: 'var(--pixel-shadow)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Press <b>R</b> to rotate
            </div>
          )}

          {editor.isEditMode && (() => {
            const selUid = editorState.selectedFurnitureUid
            const selColor = selUid
              ? officeState.getLayout().furniture.find((f) => f.uid === selUid)?.color ?? null
              : null
            return (
              <EditorToolbar
                activeTool={editorState.activeTool}
                selectedTileType={editorState.selectedTileType}
                selectedFurnitureType={editorState.selectedFurnitureType}
                selectedFurnitureUid={selUid}
                selectedFurnitureColor={selColor}
                floorColor={editorState.floorColor}
                wallColor={editorState.wallColor}
                onToolChange={editor.handleToolChange}
                onTileTypeChange={editor.handleTileTypeChange}
                onFloorColorChange={editor.handleFloorColorChange}
                onWallColorChange={editor.handleWallColorChange}
                onSelectedFurnitureColorChange={editor.handleSelectedFurnitureColorChange}
                onFurnitureTypeChange={editor.handleFurnitureTypeChange}
                loadedAssets={loadedAssets}
              />
            )
          })()}

          <ToolOverlay
            officeState={officeState}
            agents={agents}
            agentTools={agentTools}
            subagentCharacters={subagentCharacters}
            containerRef={containerRef}
            zoom={editor.zoom}
            panRef={editor.panRef}
            onCloseAgent={handleCloseAgent}
          />

          <AgentLabels
            officeState={officeState}
            agents={agents}
            agentMetas={agentMetas}
            agentStatuses={agentStatuses}
            agentTools={agentTools}
            containerRef={containerRef}
            zoom={editor.zoom}
            panRef={editor.panRef}
            subagentCharacters={subagentCharacters}
            fontScale={fontScale}
            remotePeers={remotePeers}
            onAgentClick={handleAgentClick}
          />

          <AgentListPanel
            agents={agents}
            agentMetas={agentMetas}
            agentStatuses={agentStatuses}
            agentTools={agentTools}
            subagentCharacters={subagentCharacters}
            subagentTools={subagentTools}
            fontScale={fontScale}
            remotePeers={remotePeers}
            onAgentClick={handleAgentClick}
          />
        </>
      )}

      {viewMode === 'dashboard' && (
        <DashboardView
          agents={agents}
          agentMetas={agentMetas}
          agentStatuses={agentStatuses}
          agentTools={agentTools}
          subagentCharacters={subagentCharacters}
          subagentTools={subagentTools}
          dashboardLayout={dashboardLayout}
          onAgentClick={handleAgentClick}
          fontScale={fontScale}
          remotePeers={remotePeers}
        />
      )}

      <BottomToolbar
        isEditMode={editor.isEditMode}
        onToggleEditMode={editor.handleToggleEditMode}
        isDebugMode={isDebugMode}
        onToggleDebugMode={handleToggleDebugMode}
        viewMode={viewMode}
        onSetViewMode={handleSetViewMode}
        dashboardLayout={dashboardLayout}
        onSetDashboardLayout={handleSetDashboardLayout}
        fontScale={fontScale}
        onFontScaleChange={handleSetFontScale}
        alwaysOnTop={alwaysOnTop}
        onAlwaysOnTopChange={handleSetAlwaysOnTop}
        peerName={peerName}
        onPeerNameChange={handleSetPeerName}
        broadcastEnabled={broadcastEnabled}
        onBroadcastEnabledChange={handleSetBroadcastEnabled}
        udpPort={udpPort}
        onUdpPortChange={handleSetUdpPort}
        heartbeatInterval={heartbeatInterval}
        onHeartbeatIntervalChange={handleSetHeartbeatInterval}
        soundSettings={soundSettings}
        onSoundSettingsChange={handleSetSoundSettings}
      />

      {historyPopup && (
        <StatusHistoryPopup
          agentId={historyPopup.agentId}
          agentLabel={historyPopup.label}
          history={statusHistory[historyPopup.agentId] || []}
          position={historyPopup.position}
          fontScale={fontScale}
          onClose={handleClosePopup}
        />
      )}

      {isDebugMode && (
        <DebugView
          agents={agents}
          selectedAgent={selectedAgent}
          agentTools={agentTools}
          agentStatuses={agentStatuses}
          subagentTools={subagentTools}
          onSelectAgent={handleSelectAgent}
        />
      )}
    </div>
  )
}

export default App
