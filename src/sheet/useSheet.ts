import { useEffect, useState } from 'react'
import { useJson } from 'zod-crud'
import { SheetSchema, cellKey, parseCellId } from './schema'
import { evaluateCell } from './formula'
import { loadInitial, saveSheet, moveCellId, buildData } from './storage'
import { useShortcuts } from './useShortcuts'

export function useSheet() {
  const [sheet, ops] = useJson(SheetSchema, loadInitial(), { history: 100 })
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const display = (k: string) => evaluateCell(sheet.cells, sheet.cells[k] ?? '')
  const data = buildData((k) => display(k))
  data.meta = { ...data.meta, focus: focusId }

  const writeCell = (k: string, v: string) => {
    if (v === '') {
      if (sheet.cells[k] !== undefined) ops.remove(`/cells/${k}` as never)
    } else if (sheet.cells[k] === undefined) {
      ops.add(`/cells/${k}` as never, v as never)
    } else if (sheet.cells[k] !== v) {
      ops.replace(`/cells/${k}` as never, v as never)
    }
  }

  const startEdit = (id: string, prefill?: string) => {
    const p = parseCellId(id)
    if (!p) return
    setEditing(id)
    setDraft(prefill !== undefined ? prefill : sheet.cells[cellKey(p.col, p.row)] ?? '')
  }

  const commitEdit = (move?: { dRow: number; dCol: number }) => {
    if (!editing) return
    const p = parseCellId(editing)
    if (p) writeCell(cellKey(p.col, p.row), draft)
    if (move) {
      const next = moveCellId(editing, move.dRow, move.dCol)
      if (next) setFocusId(next)
    }
    setEditing(null)
  }

  const cancelEdit = () => setEditing(null)

  useShortcuts({ editing, focusId, sheet, ops, writeCell, startEdit })

  const focusCell = focusId ? parseCellId(focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  return {
    sheet, ops, data,
    focusId, setFocusId,
    editing, draft, setDraft,
    startEdit, commitEdit, cancelEdit,
    writeCell, display,
    focusKey,
  }
}
