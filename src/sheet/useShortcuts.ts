import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import { cellKey, parseCellId, type Sheet } from './schema'
import { rectFromIds, rectToTsv, pasteTsv } from './clipboard'

interface Args {
  editing: string | null
  focusId: string | null
  sheet: Sheet
  ops: JsonOps<Sheet>
  writeCell: (k: string, v: string) => void
  startEdit: (id: string, prefill?: string) => void
  selectedIds: string[]
  openFind: () => void
}

export function useShortcuts({ editing, focusId, sheet, ops, writeCell, startEdit, selectedIds, openFind }: Args) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ck = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      if (mod && ck === 'f') {
        e.preventDefault()
        openFind()
        return
      }
      if (editing) return
      if (mod && ck === 'z') {
        e.preventDefault()
        e.shiftKey ? ops.redo() : ops.undo()
        return
      }
      if (!focusId || !parseCellId(focusId)) return
      const p = parseCellId(focusId)!
      const k = cellKey(p.col, p.row)

      const ids = selectedIds.length > 0 ? selectedIds : [focusId]
      const rect = rectFromIds(ids)

      if (mod && (ck === 'c' || ck === 'x')) {
        e.preventDefault()
        const tsv = rect ? rectToTsv(rect, (key) => sheet.cells[key] ?? '') : ''
        navigator.clipboard?.writeText(tsv).catch(() => {})
        if (ck === 'x') ids.forEach((id) => {
          const pp = parseCellId(id)
          if (pp) writeCell(cellKey(pp.col, pp.row), '')
        })
        return
      }
      if (mod && ck === 'v') {
        e.preventDefault()
        navigator.clipboard?.readText().then((t) => {
          if (t.includes('\t') || t.includes('\n')) pasteTsv(t, p, writeCell)
          else writeCell(k, t)
        }).catch(() => {})
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        ids.forEach((id) => {
          const pp = parseCellId(id)
          if (pp) writeCell(cellKey(pp.col, pp.row), '')
        })
        e.preventDefault()
        return
      }
      if (e.key.length === 1 && !mod && !e.altKey) {
        startEdit(focusId, e.key)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, focusId, ops, sheet.cells, writeCell, startEdit, selectedIds])
}
