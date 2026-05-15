import { matches } from '@interactive-os/keyboard'
import { parseCellId, cellId, type Cells } from './schema'
import { jumpToEdge, idsBetween, homeEndTarget, tabTarget } from '../lib/jumpEdge'
import { idsForCol, idsForRow } from '../lib/range'

interface NavArgs {
  focusId: string
  cells: Cells
  rowCount: number
  colLetters: readonly string[]
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
}

/** Cursor-movement keys when not editing. Returns true if handled. */
export function handleNavigation(e: KeyboardEvent, mod: boolean, a: NavArgs): boolean {
  const { focusId, cells, rowCount, colLetters, setSelectedIds, setFocusId, setSelectAnchor } = a
  const moveFocus = (next: string) => {
    setFocusId(next)
    setSelectAnchor(next)
  }
  if (matches(e, 'Mod+ArrowUp Mod+ArrowDown Mod+ArrowLeft Mod+ArrowRight')) {
    const next = jumpToEdge(focusId, cells, rowCount, e.key as 'ArrowUp', colLetters); if (!next) return true
    e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : moveFocus(next); return true
  }
  if (e.key === 'Tab') {
    const t = tabTarget(focusId, e.shiftKey, colLetters); if (t) { moveFocus(t); e.preventDefault() }; return true
  }
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const p = parseCellId(focusId); if (!p) return true
    const next = cellId(p.col, Math.max(0, Math.min(rowCount - 1, p.row + (e.key === 'PageUp' ? -10 : 10))))
    e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : moveFocus(next); return true
  }
  if (e.key === 'Home' || e.key === 'End') {
    const t = homeEndTarget(focusId, rowCount, e.key, mod, colLetters); if (t) { moveFocus(t); e.preventDefault() }; return true
  }
  if (e.key === ' ' && (e.ctrlKey !== e.shiftKey)) {
    const sp = parseCellId(focusId); if (!sp) return true
    setSelectedIds(e.ctrlKey ? idsForCol(sp.col, rowCount) : idsForRow(sp.row, colLetters)); e.preventDefault(); return true
  }
  return false
}
