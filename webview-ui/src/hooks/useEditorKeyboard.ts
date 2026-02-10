import { useEffect } from 'react'
import type { EditorState } from '../office/editor/editorState.js'

export function useEditorKeyboard(
  isEditMode: boolean,
  editorState: EditorState,
  onDeleteSelected: () => void,
  onUndo: () => void,
  onRedo: () => void,
  onEditorTick: () => void,
): void {
  useEffect(() => {
    if (!isEditMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        editorState.clearSelection()
        editorState.clearGhost()
        editorState.clearDrag()
        onEditorTick()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editorState.selectedFurnitureUid) {
          onDeleteSelected()
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        onUndo()
      } else if (
        (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
        (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
      ) {
        e.preventDefault()
        onRedo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEditMode, editorState, onDeleteSelected, onUndo, onRedo, onEditorTick])
}
