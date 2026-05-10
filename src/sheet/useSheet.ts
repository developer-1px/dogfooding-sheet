import { useEffect, useState } from 'react'
import { useJson } from 'zod-crud'
import { fromTree, type NormalizedData } from '@p/aria-kernel'
import { SheetSchema, COL_LETTERS, ROW_COUNT, cellKey, initialSheet, parseCellId } from './schema'
import { evaluateCell } from './formula'

interface Node { id: string; label: string; children?: Node[] }

function buildData(getCell: (k: string) => string): NormalizedData {
  const tree: Node[] = [
    ...COL_LETTERS.map((c): Node => ({ id: `h-${c}`, label: c })),
    ...Array.from({ length: ROW_COUNT }, (_, r): Node => ({
      id: `r${r}`,
      label: String(r + 1),
      children: COL_LETTERS.map((c) => ({
        id: `r${r}-${c}`,
        label: getCell(cellKey(c, r)),
      })),
    })),
  ]
  return fromTree(tree)
}

export function useSheet() {
  const [sheet, ops] = useJson(SheetSchema, initialSheet, { history: 100 })
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const display = (k: string) => evaluateCell(sheet.cells, sheet.cells[k] ?? '')
  const data = buildData(display)
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

  const commitEdit = () => {
    if (!editing) return
    const p = parseCellId(editing)
    if (p) writeCell(cellKey(p.col, p.row), draft)
    setEditing(null)
  }

  const cancelEdit = () => setEditing(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) ops.redo()
        else ops.undo()
        return
      }
      if (focusId && parseCellId(focusId)) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const p = parseCellId(focusId)!
          writeCell(cellKey(p.col, p.row), '')
          e.preventDefault()
          return
        }
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          startEdit(focusId, e.key)
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, focusId, ops, sheet.cells])

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
