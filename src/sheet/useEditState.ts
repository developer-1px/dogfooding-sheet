import { useState } from 'react'
import { cellKey, parseCellId } from './schema'
import { moveCellId } from './storage'

interface Args {
  cells: Record<string, string>
  writeCell: (k: string, v: string) => void
}

export function useEditState({ cells, writeCell }: Args) {
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const startEdit = (id: string, prefill?: string) => {
    const p = parseCellId(id)
    if (!p) return
    setEditing(id)
    setDraft(prefill !== undefined ? prefill : cells[cellKey(p.col, p.row)] ?? '')
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

  const focusCell = focusId ? parseCellId(focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  return {
    focusId, setFocusId,
    editing, draft, setDraft,
    startEdit, commitEdit, cancelEdit,
    focusKey,
  }
}
