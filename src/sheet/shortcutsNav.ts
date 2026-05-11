import { parseCellId, ROW_COUNT, type Cells } from './schema'
import { jumpToEdge, idsBetween, homeEndTarget, tabTarget } from '../lib/jumpEdge'
import { idsForCol, idsForRow } from '../lib/range'

interface NavArgs {
  focusId: string
  cells: Cells
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
}

/** Cursor-movement keys when not editing. Returns true if handled. */
export function handleNavigation(e: KeyboardEvent, mod: boolean, a: NavArgs): boolean {
  const { focusId, cells, setSelectedIds, setFocusId } = a
  if (mod && /^Arrow(Up|Down|Left|Right)$/.test(e.key)) {
    const next = jumpToEdge(focusId, cells, ROW_COUNT, e.key as 'ArrowUp'); if (!next) return true
    e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : setFocusId(next); return true
  }
  if (e.key === 'Tab') {
    const t = tabTarget(focusId, e.shiftKey); if (t) { setFocusId(t); e.preventDefault() }; return true
  }
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const p = parseCellId(focusId); if (!p) return true
    const next = `r${Math.max(0, Math.min(ROW_COUNT - 1, p.row + (e.key === 'PageUp' ? -10 : 10)))}-${p.col}`
    e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : setFocusId(next); return true
  }
  if (e.key === 'Home' || e.key === 'End') {
    const t = homeEndTarget(focusId, ROW_COUNT, e.key, mod); if (t) { setFocusId(t); e.preventDefault() }; return true
  }
  if (e.key === ' ' && (e.ctrlKey !== e.shiftKey)) {
    const sp = parseCellId(focusId); if (!sp) return true
    setSelectedIds(e.ctrlKey ? idsForCol(sp.col, ROW_COUNT) : idsForRow(sp.row)); e.preventDefault(); return true
  }
  return false
}
