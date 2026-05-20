import { useEffect, useRef } from 'react'
import { isEditableTarget, isPrintable } from '@interactive-os/keyboard'
import type { JSONOps } from 'zod-crud'
import type { Sheet } from './schema'
import { handleNavigation } from './selection/shortcutsNav'
import { useGlobalShortcuts, type GlobalShortcutCtx } from './useGlobalShortcuts'

interface Args extends GlobalShortcutCtx {
  editing: string | null
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
  startEdit: (id: string, prefill?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
}
// Re-export for callers that already import the surface from this module.
export type { Sheet }
export type { JSONOps }

export function useShortcuts(args: Args) {
  const ref = useRef(args)
  useEffect(() => { ref.current = args }, [args])
  useGlobalShortcuts(() => ref.current)

  // Keys that aria-kernel useShortcut can't express cleanly (any-printable to start edit,
  // focus-state-dependent navigation, edit triggers). Capture handler with explicit
  // editable-guard for side inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = ref.current
      const ae = document.activeElement
      if (isEditableTarget(ae) && !(ae as HTMLElement).classList.contains('cell-input')) return
      const { editing, focusId, setSelectedIds, setFocusId, sheet, selectedIds, startEdit } = c
      if (!editing && focusId && handleNavigation(e, e.metaKey || e.ctrlKey, { focusId, cells: sheet.cells, rowCount: c.rowCount, colLetters: c.colLetters, selectedIds, setSelectedIds, setFocusId, setSelectAnchor: c.setSelectAnchor })) return
      if (e.key === 'Escape' && !editing && selectedIds.length > 0) { setSelectedIds([]); e.preventDefault(); return }
      if (editing) return
      if (!focusId) return
      // F2/Enter — grid pattern emits editStart from cell.onKeyDown (see useSheetGrid).
      if (isPrintable(e)) { startEdit(focusId, e.key); e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
