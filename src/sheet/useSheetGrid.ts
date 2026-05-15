import { type UiEvent } from '@interactive-os/aria-kernel'
import { useGridPattern } from '@interactive-os/aria-kernel/patterns'
import { useGridDragSelectGesture } from '@interactive-os/aria-kernel/gesture'
import { gridRectEvents } from '@interactive-os/aria-kernel/axes/gridMultiSelect'
import type { NormalizedData } from '@interactive-os/aria-kernel'

interface Args {
  data: NormalizedData
  rowCount: number
  colCount: number
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
  setSelectAnchor: (id: string | null) => void
  startEdit?: (id: string, prefill?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  isEditing?: () => boolean
}

export function useSheetGrid({ data, rowCount, colCount, setFocusId, setSelectedIds, setSelectAnchor, startEdit, isEditing }: Args) {
  const onEvent = (e: UiEvent) => {
    // Plain navigate (click/Arrow): selection cleared; the following select{anchor:true} re-locks anchor.
    // Shift+Arrow navigate: no select{anchor:true} follows, so existing anchor is preserved.
    if (e.type === 'navigate' && e.id) { setFocusId(e.id); setSelectedIds([]); return }
    if (e.type === 'activate' && e.id) return
    // aria-kernel#141 — Enter inside cell-input bubbles to grid root and matches the editable-mode
    // chord, re-firing editStart and resetting draft. Guard until the kernel adds editable-guard.
    if (e.type === 'editStart' && e.id) { if (isEditing?.()) return; startEdit?.(e.id, undefined, { caret: 'end' }); return }
    if (e.type === 'select') {
      // aria-kernel#142 — kernel signals new range anchor via select{anchor:true}; persist so
      // subsequent Shift+Arrow extends from this point instead of silently using currentId.
      if (e.anchor && e.ids?.[0]) setSelectAnchor(e.ids[0])
      if (e.to === undefined) setSelectedIds(e.ids)
      else if (e.to) setSelectedIds((p) => [...new Set([...p, ...e.ids])])
      else setSelectedIds((p) => p.filter((id) => !e.ids.includes(id)))
    }
  }
  const grid = useGridPattern(data, onEvent, {
    label: 'Spreadsheet',
    rowCount: rowCount + 1,
    colCount,
    editable: true,
    selectionMode: 'rect',
    // Workaround aria-kernel#140 — built-in Backspace/Delete chord lacks an editable-guard,
    // so it would PD keystrokes inside the cell-input. We re-implement remove at the global
    // useShortcut layer (which DOES editable-guard).
    disableBuiltinChords: true,
  })
  const drag = useGridDragSelectGesture(data, onEvent)
  // Workaround aria-kernel#157 — useGridDragSelectGesture는 e.shiftKey를 무시함.
  // Shift+Click rect 확장은 여기서 gridRectEvents로 직접 분기 (anchor = data.meta.selectAnchor ?? focus).
  const getCellHandlers = (id: string) => {
    const native = drag.getCellHandlers(id)
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (e.shiftKey) {
          const anchor = data.meta?.selectAnchor ?? data.meta?.focus
          if (anchor) {
            e.preventDefault()
            for (const ev of gridRectEvents(data, anchor, id)) onEvent(ev)
            return
          }
        }
        native.onMouseDown(e)
      },
      onMouseEnter: native.onMouseEnter,
    }
  }
  return { ...grid, getCellHandlers }
}
