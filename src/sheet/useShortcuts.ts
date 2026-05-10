import { useEffect, useRef } from 'react'
import type { JsonOps } from 'zod-crud'
import { cellKey, parseCellId, ROW_COUNT, type Sheet } from './schema'
import { copyOrCut, pasteAt, freezeFormulas, insertNowOrToday } from '../lib/clipboardOps'
import { fillDown, fillRight } from '../lib/fillDown'
import { jumpToEdge, idsBetween, homeEndTarget, tabTarget } from '../lib/jumpEdge'
import { idsForCol, idsForRow, idsForAll } from '../lib/range'

interface Args {
  editing: string | null
  focusId: string | null
  sheet: Sheet
  ops: JsonOps<Sheet>
  writeCell: (k: string, v: string) => void
  startEdit: (id: string, prefill?: string) => void
  selectedIds: string[]
  openFind: () => void
  openReplace: () => void
  openHelp: () => void
  openGoto: () => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  clearFormat: () => void
  saveCsv: () => void
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
  switchTab?: (delta: 1 | -1) => void
  display?: (k: string) => string
  applyFormat?: (key: 'plain' | 'currency' | 'percent' | 'date') => void
  editNote?: () => void
}

export function useShortcuts(args: Args) {
  const ref = useRef(args)
  ref.current = args
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { editing, focusId, sheet, ops, writeCell, startEdit, selectedIds, openFind, openReplace, openHelp, openGoto, toggleBold, toggleItalic, toggleUnderline, clearFormat, saveCsv, setSelectedIds, setFocusId } = ref.current
      const ck = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      if (!editing && (e.key === 'F1' || (e.key === '?' && !mod) || (mod && e.key === '/'))) {
        e.preventDefault()
        openHelp()
        return
      }
      if (mod && !e.shiftKey && !e.altKey) {
        const fn = ({ f: openFind, h: openReplace, b: toggleBold, i: toggleItalic, u: toggleUnderline, s: saveCsv, '\\': clearFormat } as Record<string, () => void>)[ck]
        if (fn) { e.preventDefault(); fn(); return }
      }
      if (mod && ck === 'g' && !editing) { e.preventDefault(); openGoto(); return }
      if (mod && ck === 'a' && !editing) { e.preventDefault(); setSelectedIds(idsForAll(ROW_COUNT)); return }
      if (mod && !editing && (e.key === 'PageUp' || e.key === 'PageDown') && ref.current.switchTab) { e.preventDefault(); ref.current.switchTab(e.key === 'PageDown' ? 1 : -1); return }
      if (mod && e.shiftKey) {
        if (ck === 'm' && ref.current.editNote) { e.preventDefault(); ref.current.editNote(); return }
        const f = ({ '1': 'plain', '4': 'currency', '5': 'percent', '3': 'date' } as const)[e.key as '1']
        if (f && ref.current.applyFormat) { e.preventDefault(); ref.current.applyFormat(f); return }
      }
      if (mod && e.key === ';' && !e.altKey) { e.preventDefault(); insertNowOrToday(focusId, e.shiftKey, writeCell); return }
      if (mod && !editing && /^Arrow(Up|Down|Left|Right)$/.test(e.key) && focusId) {
        const next = jumpToEdge(focusId, sheet.cells, ROW_COUNT, e.key as 'ArrowUp'); if (!next) return
        e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : setFocusId(next); return
      }
      if (!editing && focusId && e.key === 'Tab') {
        const t = tabTarget(focusId, e.shiftKey); if (t) { setFocusId(t); e.preventDefault() }; return
      }
      if (!editing && focusId && (e.key === 'PageUp' || e.key === 'PageDown')) {
        const p = parseCellId(focusId); if (!p) return
        const next = `r${Math.max(0, Math.min(ROW_COUNT - 1, p.row + (e.key === 'PageUp' ? -10 : 10)))}-${p.col}`
        e.preventDefault(); e.shiftKey ? setSelectedIds(idsBetween(focusId, next)) : setFocusId(next); return
      }
      if (!editing && focusId && (e.key === 'Home' || e.key === 'End')) {
        const t = homeEndTarget(focusId, ROW_COUNT, e.key, mod); if (t) { setFocusId(t); e.preventDefault() }; return
      }
      if (!editing && focusId && e.key === ' ' && (e.ctrlKey !== e.shiftKey)) {
        const sp = parseCellId(focusId); if (!sp) return
        setSelectedIds(e.ctrlKey ? idsForCol(sp.col, ROW_COUNT) : idsForRow(sp.row)); e.preventDefault(); return
      }
      if (e.key === 'Escape' && !editing && selectedIds.length > 0) { setSelectedIds([]); e.preventDefault(); return }
      if (editing) return
      if (mod && (ck === 'd' || ck === 'r') && selectedIds.length > 1) { e.preventDefault(); (ck === 'd' ? fillDown : fillRight)(selectedIds, sheet.cells, writeCell); return }
      if (mod && ck === 'z') { e.preventDefault(); e.shiftKey ? ops.redo() : ops.undo(); return }
      if (mod && ck === 'y') { e.preventDefault(); ops.redo(); return }
      const p = focusId ? parseCellId(focusId) : null
      if (!p || !focusId) return
      const k = cellKey(p.col, p.row), ids = selectedIds.length > 0 ? selectedIds : [focusId]

      if (mod && (ck === 'c' || ck === 'x')) { e.preventDefault(); copyOrCut(ids, ck === 'x', sheet.cells, writeCell); return }
      if (mod && ck === 'v') { e.preventDefault(); pasteAt(k, p, ROW_COUNT, writeCell); return }
      if (e.key === 'Delete' || e.key === 'Backspace') { ids.forEach((id) => { const pp = parseCellId(id); if (pp) writeCell(cellKey(pp.col, pp.row), '') }); e.preventDefault(); return }
      const ae = document.activeElement as HTMLElement | null
      if ((ae?.tagName === 'INPUT' || ae?.tagName === 'TEXTAREA') && !ae.classList.contains('cell-input')) return
      if (e.key === 'F9' && ref.current.display) { e.preventDefault(); freezeFormulas(ids, sheet.cells, ref.current.display, writeCell); return }
      if (e.key === 'F2' || e.key === 'Enter') { startEdit(focusId); e.preventDefault(); e.stopPropagation(); return }
      if (e.key.length === 1 && !mod && !e.altKey) { startEdit(focusId, e.key); e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
