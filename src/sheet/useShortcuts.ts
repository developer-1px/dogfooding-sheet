import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import { cellKey, parseCellId, type Sheet } from './schema'

interface Args {
  editing: string | null
  focusId: string | null
  sheet: Sheet
  ops: JsonOps<Sheet>
  writeCell: (k: string, v: string) => void
  startEdit: (id: string, prefill?: string) => void
}

export function useShortcuts({ editing, focusId, sheet, ops, writeCell, startEdit }: Args) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return
      const ck = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      if (mod && ck === 'z') {
        e.preventDefault()
        e.shiftKey ? ops.redo() : ops.undo()
        return
      }
      if (!focusId || !parseCellId(focusId)) return
      const p = parseCellId(focusId)!
      const k = cellKey(p.col, p.row)
      if (mod && (ck === 'c' || ck === 'x')) {
        e.preventDefault()
        navigator.clipboard?.writeText(sheet.cells[k] ?? '').catch(() => {})
        if (ck === 'x') writeCell(k, '')
        return
      }
      if (mod && ck === 'v') {
        e.preventDefault()
        navigator.clipboard?.readText().then((t) => writeCell(k, t)).catch(() => {})
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        writeCell(k, '')
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
  }, [editing, focusId, ops, sheet.cells, writeCell, startEdit])
}
