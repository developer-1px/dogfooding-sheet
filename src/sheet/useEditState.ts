import { useEditable, type NavDir } from 'editable-lifecycle'
import { cellKey, parseCellId } from './schema'
import { moveCellId } from './storage'

interface Args {
  cells: Record<string, string>
  writeCell: (k: string, v: string) => void
}

const dirDelta: Record<NavDir, { dRow: number; dCol: number }> = {
  down: { dRow: 1, dCol: 0 },
  up: { dRow: -1, dCol: 0 },
  right: { dRow: 0, dCol: 1 },
  left: { dRow: 0, dCol: -1 },
}

export function useEditState({ cells, writeCell }: Args) {
  const ed = useEditable<string>({
    getValue: (id) => {
      const p = parseCellId(id)
      return p ? cells[cellKey(p.col, p.row)] ?? '' : ''
    },
    onCommit: (id, next) => {
      const p = parseCellId(id)
      if (p) writeCell(cellKey(p.col, p.row), next)
    },
    onNavigate: (id, dir) => {
      const { dRow, dCol } = dirDelta[dir]
      return moveCellId(id, dRow, dCol)
    },
    initialFocus: 'r0-A',
  })

  // Adapt commitEdit({ dRow, dCol }) → editable-lifecycle NavDir API to keep callers untouched.
  const commitEdit = (move?: { dRow: number; dCol: number }) => {
    if (!move) return ed.commitEdit()
    const dir = move.dRow > 0 ? 'down' : move.dRow < 0 ? 'up' : move.dCol > 0 ? 'right' : 'left'
    ed.commitEdit(dir)
  }

  const focusCell = ed.focusId ? parseCellId(ed.focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  return {
    focusId: ed.focusId,
    setFocusId: ed.setFocusId,
    editing: ed.editing,
    draft: ed.draft,
    setDraft: ed.setDraft,
    startEdit: ed.startEdit,
    commitEdit,
    cancelEdit: ed.cancelEdit,
    focusKey,
  }
}
