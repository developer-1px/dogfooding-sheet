import { type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'
import { COL_LETTERS, ROW_COUNT, parseCellId } from './schema'
import type { NormalizedData } from '@p/aria-kernel'

interface Args {
  data: NormalizedData
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
  startEdit: (id: string) => void
}

export function useSheetGrid({ data, setFocusId, setSelectedIds, startEdit }: Args) {
  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) { setFocusId(e.id); setSelectedIds([]); return }
    if (e.type === 'activate' && e.id && parseCellId(e.id)) { startEdit(e.id); return }
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
  })
}
