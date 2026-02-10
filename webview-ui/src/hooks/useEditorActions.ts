import { useState, useCallback, useRef } from 'react'
import type { OfficeState } from '../office/engine/officeState.js'
import type { EditorState } from '../office/editor/editorState.js'
import { EditTool } from '../office/types.js'
import { TileType } from '../office/types.js'
import type { OfficeLayout, EditTool as EditToolType, TileType as TileTypeVal, FloorColor } from '../office/types.js'
import { paintTile, placeFurniture, removeFurniture, moveFurniture, canPlaceFurniture } from '../office/editor/editorActions.js'
import { getCatalogEntry } from '../office/layout/furnitureCatalog.js'
import { defaultZoom } from '../office/toolUtils.js'
import { vscode } from '../vscodeApi.js'

export interface EditorActions {
  isEditMode: boolean
  editorTick: number
  isDirty: boolean
  zoom: number
  panRef: React.MutableRefObject<{ x: number; y: number }>
  saveTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  setLastSavedLayout: (layout: OfficeLayout) => void
  handleOpenClaude: () => void
  handleToggleEditMode: () => void
  handleToolChange: (tool: EditToolType) => void
  handleTileTypeChange: (type: TileTypeVal) => void
  handleFloorColorChange: (color: FloorColor) => void
  handleFurnitureTypeChange: (type: string) => void // FurnitureType enum or asset ID
  handleDeleteSelected: () => void
  handleUndo: () => void
  handleRedo: () => void
  handleReset: () => void
  handleSave: () => void
  handleZoomChange: (zoom: number) => void
  handleEditorTileAction: (col: number, row: number) => void
  handleDragMove: (uid: string, newCol: number, newRow: number) => void
}

export function useEditorActions(
  getOfficeState: () => OfficeState,
  editorState: EditorState,
): EditorActions {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editorTick, setEditorTick] = useState(0)
  const [isDirty, setIsDirty] = useState(false)
  const [zoom, setZoom] = useState(defaultZoom)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panRef = useRef({ x: 0, y: 0 })
  const lastSavedLayoutRef = useRef<OfficeLayout | null>(null)

  // Called by useExtensionMessages on layoutLoaded to set the initial checkpoint
  const setLastSavedLayout = useCallback((layout: OfficeLayout) => {
    lastSavedLayoutRef.current = structuredClone(layout)
  }, [])

  // Debounced layout save
  const saveLayout = useCallback((layout: OfficeLayout) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      vscode.postMessage({ type: 'saveLayout', layout })
    }, 500)
  }, [])

  // Apply a layout edit: push undo, clear redo, rebuild state, save, mark dirty
  const applyEdit = useCallback((newLayout: OfficeLayout) => {
    const os = getOfficeState()
    editorState.pushUndo(os.getLayout())
    editorState.clearRedo()
    editorState.isDirty = true
    setIsDirty(true)
    os.rebuildFromLayout(newLayout)
    saveLayout(newLayout)
    setEditorTick((n) => n + 1)
  }, [getOfficeState, editorState, saveLayout])

  const handleOpenClaude = useCallback(() => {
    vscode.postMessage({ type: 'openClaude' })
  }, [])

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const next = !prev
      editorState.isEditMode = next
      if (!next) {
        editorState.clearSelection()
        editorState.clearGhost()
        editorState.clearDrag()
      }
      return next
    })
  }, [editorState])

  // Tool toggle: clicking already-active tool deselects it (returns to SELECT)
  const handleToolChange = useCallback((tool: EditToolType) => {
    if (editorState.activeTool === tool) {
      editorState.activeTool = EditTool.SELECT
    } else {
      editorState.activeTool = tool
    }
    editorState.clearSelection()
    editorState.clearGhost()
    editorState.clearDrag()
    setEditorTick((n) => n + 1)
  }, [editorState])

  const handleTileTypeChange = useCallback((type: TileTypeVal) => {
    editorState.selectedTileType = type
    setEditorTick((n) => n + 1)
  }, [editorState])

  const handleFloorColorChange = useCallback((color: FloorColor) => {
    editorState.floorColor = color
    setEditorTick((n) => n + 1)
  }, [editorState])

  const handleFurnitureTypeChange = useCallback((type: string) => {
    editorState.selectedFurnitureType = type
    setEditorTick((n) => n + 1)
  }, [editorState])

  const handleDeleteSelected = useCallback(() => {
    const uid = editorState.selectedFurnitureUid
    if (!uid) return
    const os = getOfficeState()
    const newLayout = removeFurniture(os.getLayout(), uid)
    if (newLayout !== os.getLayout()) {
      applyEdit(newLayout)
      editorState.clearSelection()
    }
  }, [getOfficeState, editorState, applyEdit])

  const handleUndo = useCallback(() => {
    const prev = editorState.popUndo()
    if (!prev) return
    const os = getOfficeState()
    // Push current layout to redo stack before restoring
    editorState.pushRedo(os.getLayout())
    os.rebuildFromLayout(prev)
    saveLayout(prev)
    editorState.isDirty = true
    setIsDirty(true)
    setEditorTick((n) => n + 1)
  }, [getOfficeState, editorState, saveLayout])

  const handleRedo = useCallback(() => {
    const next = editorState.popRedo()
    if (!next) return
    const os = getOfficeState()
    // Push current layout to undo stack before restoring
    editorState.pushUndo(os.getLayout())
    os.rebuildFromLayout(next)
    saveLayout(next)
    editorState.isDirty = true
    setIsDirty(true)
    setEditorTick((n) => n + 1)
  }, [getOfficeState, editorState, saveLayout])

  const handleReset = useCallback(() => {
    if (!lastSavedLayoutRef.current) return
    const saved = structuredClone(lastSavedLayoutRef.current)
    applyEdit(saved)
    editorState.reset()
    setIsDirty(false)
  }, [editorState, applyEdit])

  const handleSave = useCallback(() => {
    // Flush any pending debounced save immediately
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const os = getOfficeState()
    const layout = os.getLayout()
    lastSavedLayoutRef.current = structuredClone(layout)
    vscode.postMessage({ type: 'saveLayout', layout })
    editorState.isDirty = false
    setIsDirty(false)
  }, [getOfficeState, editorState])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(1, Math.min(10, newZoom)))
  }, [])

  const handleDragMove = useCallback((uid: string, newCol: number, newRow: number) => {
    const os = getOfficeState()
    const layout = os.getLayout()
    const newLayout = moveFurniture(layout, uid, newCol, newRow)
    if (newLayout !== layout) {
      applyEdit(newLayout)
    }
  }, [getOfficeState, applyEdit])

  const handleEditorTileAction = useCallback((col: number, row: number) => {
    const os = getOfficeState()
    const layout = os.getLayout()

    if (editorState.activeTool === EditTool.TILE_PAINT) {
      const newLayout = paintTile(layout, col, row, editorState.selectedTileType, editorState.floorColor)
      if (newLayout !== layout) {
        applyEdit(newLayout)
      }
    } else if (editorState.activeTool === EditTool.FURNITURE_PLACE) {
      const type = editorState.selectedFurnitureType
      if (canPlaceFurniture(layout, type, col, row)) {
        const uid = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const newLayout = placeFurniture(layout, { uid, type, col, row })
        if (newLayout !== layout) {
          applyEdit(newLayout)
        }
      }
    } else if (editorState.activeTool === EditTool.EYEDROPPER) {
      const idx = row * layout.cols + col
      const tile = layout.tiles[idx]
      if (tile !== undefined && tile !== TileType.WALL) {
        editorState.selectedTileType = tile
        const color = layout.tileColors?.[idx]
        if (color) {
          editorState.floorColor = { ...color }
        }
        editorState.activeTool = EditTool.TILE_PAINT
      } else if (tile === TileType.WALL) {
        editorState.selectedTileType = TileType.WALL
        editorState.activeTool = EditTool.TILE_PAINT
      }
      setEditorTick((n) => n + 1)
    } else if (editorState.activeTool === EditTool.SELECT) {
      const hit = layout.furniture.find((f) => {
        const entry = getCatalogEntry(f.type)
        if (!entry) return false
        return col >= f.col && col < f.col + entry.footprintW && row >= f.row && row < f.row + entry.footprintH
      })
      editorState.selectedFurnitureUid = hit ? hit.uid : null
      setEditorTick((n) => n + 1)
    }
  }, [getOfficeState, editorState, applyEdit])

  return {
    isEditMode,
    editorTick,
    isDirty,
    zoom,
    panRef,
    saveTimerRef,
    setLastSavedLayout,
    handleOpenClaude,
    handleToggleEditMode,
    handleToolChange,
    handleTileTypeChange,
    handleFloorColorChange,
    handleFurnitureTypeChange,
    handleDeleteSelected,
    handleUndo,
    handleRedo,
    handleReset,
    handleSave,
    handleZoomChange,
    handleEditorTileAction,
    handleDragMove,
  }
}
