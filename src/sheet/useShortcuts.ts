import { useEffect, useRef } from 'react'
import type { JsonOps } from 'zod-crud'
import { cellKey, parseCellId, ROW_COUNT, type Sheet } from './schema'
import { rectFromIds, rectToTsv, pasteTsv } from '../lib/clipboard'
import { fillDown, fillRight } from '../lib/fillDown'
import { jumpToEdge, idsBetween } from '../lib/jumpEdge'
import { idsForCol, idsForRow } from '../lib/range'

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
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  clearFormat: () => void
  saveCsv: () => void
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
}

export function useShortcuts(args: Args) {
  const ref = useRef(args)
  ref.current = args
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { editing, focusId, sheet, ops, writeCell, startEdit, selectedIds, openFind, openReplace, openHelp, toggleBold, toggleItalic, toggleUnderline, clearFormat, saveCsv, setSelectedIds, setFocusId } = ref.current
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
      if (mod && e.key === ';' && !e.altKey) {
        e.preventDefault()
        const p2 = focusId ? parseCellId(focusId) : null; if (!p2) return
        const d = new Date(), pad = (n: number) => String(n).padStart(2, '0')
        writeCell(cellKey(p2.col, p2.row), e.shiftKey ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
        return
      }
      if (mod && !editing && /^Arrow(Up|Down|Left|Right)$/.test(e.key) && focusId) {
        const next = jumpToEdge(focusId, sheet.cells, ROW_COUNT, e.key as 'ArrowUp')
        if (!next) return
        if (e.shiftKey) setSelectedIds(idsBetween(focusId, next))
        else setFocusId(next)
        e.preventDefault()
        return
      }
      if (!editing && focusId && e.key === ' ' && (e.ctrlKey !== e.shiftKey)) {
        const p = parseCellId(focusId); if (!p) return
        setSelectedIds(e.ctrlKey ? idsForCol(p.col, ROW_COUNT) : idsForRow(p.row))
        e.preventDefault()
        return
      }
      if (e.key === 'Escape' && !editing && selectedIds.length > 0) {
        setSelectedIds([])
        e.preventDefault()
        return
      }
      if (editing) return
      if (mod && (ck === 'd' || ck === 'r') && selectedIds.length > 1) { e.preventDefault(); (ck === 'd' ? fillDown : fillRight)(selectedIds, sheet.cells, writeCell); return }
      if (mod && ck === 'z') { e.preventDefault(); e.shiftKey ? ops.redo() : ops.undo(); return }
      if (mod && ck === 'y') { e.preventDefault(); ops.redo(); return }
      const p = focusId ? parseCellId(focusId) : null
      if (!p || !focusId) return
      const k = cellKey(p.col, p.row), ids = selectedIds.length > 0 ? selectedIds : [focusId], rect = rectFromIds(ids)

      if (mod && (ck === 'c' || ck === 'x')) {
        e.preventDefault()
        const tsv = rect ? rectToTsv(rect, (key) => sheet.cells[key] ?? '') : ''
        navigator.clipboard?.writeText(tsv).catch(() => {})
        if (ck === 'x') ids.forEach((id) => { const pp = parseCellId(id); if (pp) writeCell(cellKey(pp.col, pp.row), '') })
        return
      }
      if (mod && ck === 'v') {
        e.preventDefault()
        navigator.clipboard?.readText().then((t) => t.includes('\t') || t.includes('\n') ? pasteTsv(t, p, writeCell, { maxRow: ROW_COUNT }) : writeCell(k, t)).catch(() => {})
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { ids.forEach((id) => { const pp = parseCellId(id); if (pp) writeCell(cellKey(pp.col, pp.row), '') }); e.preventDefault(); return }
      const ae = document.activeElement as HTMLElement | null
      if ((ae?.tagName === 'INPUT' || ae?.tagName === 'TEXTAREA') && !ae.classList.contains('cell-input')) return
      if (e.key === 'F2' || e.key === 'Enter') { startEdit(focusId); e.preventDefault(); e.stopPropagation(); return }
      if (e.key.length === 1 && !mod && !e.altKey) { startEdit(focusId, e.key); e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}
