import { type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'
import { COL_LETTERS, ROW_COUNT } from './schema'
import type { NormalizedData } from '@p/aria-kernel'

interface Args {
  data: NormalizedData
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
}

export function useSheetGrid({ data, setFocusId, setSelectedIds }: Args) {
  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) { setFocusId(e.id); setSelectedIds([]); return }
    // Click activate fires before useShortcuts F2/Enter sees the keydown for typed letters,
    // so we no longer auto-startEdit on activate. Edit is started from useShortcuts (F2/Enter/letter)
    // or Cell's onDoubleClick.
    if (e.type === 'activate' && e.id) return
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
