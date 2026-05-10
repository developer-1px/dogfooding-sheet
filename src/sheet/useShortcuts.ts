import { useEffect, useRef } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { handleNavigation } from './shortcutsNav'
import { useGlobalShortcuts, type GlobalShortcutCtx } from './useGlobalShortcuts'

interface Args extends GlobalShortcutCtx {
  editing: string | null
  setFocusId: (id: string) => void
  startEdit: (id: string, prefill?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
}
// Re-export for callers that already import the surface from this module.
export type { Sheet }
export type { JsonOps }

const isEditableTarget = (t: EventTarget | null): boolean => {
  const el = t as HTMLElement | null
  if (!el) return false
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true
  return el.isContentEditable
}

export function useShortcuts(args: Args) {
  const ref = useRef(args)
  ref.current = args
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
      if (!editing && focusId && handleNavigation(e, e.metaKey || e.ctrlKey, { focusId, cells: sheet.cells, setSelectedIds, setFocusId })) return
      if (e.key === 'Escape' && !editing && selectedIds.length > 0) { setSelectedIds([]); e.preventDefault(); return }
      if (editing) return
      if (!focusId) return
      // F2/Enter — grid pattern emits editStart from cell.onKeyDown (see useSheetGrid).
      if (e.key.length === 1 && !(e.metaKey || e.ctrlKey) && !e.altKey) { startEdit(focusId, e.key); e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
