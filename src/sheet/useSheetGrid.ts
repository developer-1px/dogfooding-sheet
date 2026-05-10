import { type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'
import { COL_LETTERS, ROW_COUNT } from './schema'
import type { NormalizedData } from '@p/aria-kernel'

interface Args {
  data: NormalizedData
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
  startEdit?: (id: string, prefill?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  isEditing?: () => boolean
}

export function useSheetGrid({ data, setFocusId, setSelectedIds, startEdit, isEditing }: Args) {
  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) { setFocusId(e.id); setSelectedIds([]); return }
    // click → activate (focus/select intent only). edit-mode 진입은 F2 → editStart 이벤트.
    if (e.type === 'activate' && e.id) return
    // aria-kernel#141 — Enter inside cell-input bubbles to grid root and matches the editable-mode
    // chord, re-firing editStart and resetting draft. Guard until the kernel adds editable-guard.
    if (e.type === 'editStart' && e.id) { if (isEditing?.()) return; startEdit?.(e.id, undefined, { caret: 'end' }); return }
    if (e.type === 'select') {
      if (e.to === undefined) setSelectedIds(e.ids)
      else if (e.to) setSelectedIds((p) => [...new Set([...p, ...e.ids])])
      else setSelectedIds((p) => p.filter((id) => !e.ids.includes(id)))
    }
  }
  return useGridPattern(data, onEvent, {
    label: 'Spreadsheet',
    rowCount: ROW_COUNT + 1,
    colCount: COL_LETTERS.length,
    editable: true,
    selectionMode: 'rect',
    // Workaround aria-kernel#140 — built-in Backspace/Delete chord lacks an editable-guard,
    // so it would PD keystrokes inside the cell-input. We re-implement remove at the global
    // useShortcut layer (which DOES editable-guard).
    disableBuiltinChords: true,
  })
}
