import { matchesShortcut } from '@interactive-os/keyboard'
import { parseCellId, type Cells } from '../../../entities/Sheet/schema'
import { jumpToEdge, idsBetween, homeEndTarget, pageTarget, tabTarget } from './jumpEdge'
import { appendIdsForCol, appendIdsForRow, idsForCol, idsForRow, rectFromIds } from '@spredsheet/grid'

interface NavArgs {
  focusId: string
  cells: Cells
  rowCount: number
  colLetters: readonly string[]
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
}

/** Cursor-movement keys when not editing. Returns true if handled. */
export function handleNavigation(e: KeyboardEvent, mod: boolean, a: NavArgs): boolean {
  const { focusId, cells, rowCount, colLetters, selectedIds, setSelectedIds, setFocusId, setSelectAnchor } = a
  const moveFocus = (next: string) => {
    setFocusId(next)
    setSelectAnchor(next)
  }
  if (matchesShortcut(e, 'Mod+ArrowUp Mod+ArrowDown Mod+ArrowLeft Mod+ArrowRight')) {
    const next = jumpToEdge(focusId, cells, rowCount, e.key as 'ArrowUp', colLetters); if (!next) return true
    e.preventDefault()
    if (e.shiftKey) setSelectedIds(idsBetween(focusId, next))
    else moveFocus(next)
    return true
  }
  if (e.key === 'Tab') {
    const t = tabTarget(focusId, e.shiftKey, colLetters); if (t) { moveFocus(t); e.preventDefault() }; return true
  }
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const next = pageTarget(focusId, rowCount, e.key); if (!next) return true
    e.preventDefault()
    if (e.shiftKey) setSelectedIds(idsBetween(focusId, next))
    else moveFocus(next)
    return true
  }
  if (e.key === 'Home' || e.key === 'End') {
    const t = homeEndTarget(focusId, rowCount, e.key, mod, colLetters); if (t) { moveFocus(t); e.preventDefault() }; return true
  }
  if (e.key === ' ' && (e.ctrlKey !== e.shiftKey)) {
    const sp = parseCellId(focusId); if (!sp) return true
    const rect = selectedIds.length > 1 ? rectFromIds(selectedIds) : null
    if (e.ctrlKey && rect) {
      const ids: string[] = []
      for (let col = rect.cMin; col <= rect.cMax; col++) appendIdsForCol(ids, colLetters[col], rowCount)
      setSelectedIds(ids)
    } else if (e.shiftKey && rect) {
      const ids: string[] = []
      for (let row = rect.rMin; row <= rect.rMax; row++) appendIdsForRow(ids, row, colLetters)
      setSelectedIds(ids)
    } else {
      setSelectedIds(e.ctrlKey ? idsForCol(sp.col, rowCount) : idsForRow(sp.row, colLetters))
    }
    e.preventDefault(); return true
  }
  return false
}
