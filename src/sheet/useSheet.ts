import { useEffect, useState } from 'react'
import { useJson } from 'zod-crud'
import { SheetSchema, cellKey, parseCellId, COL_LETTERS } from './schema'
import { evaluateCell, refsInFormula } from './formula'
import { loadInitial, saveSheet, moveCellId, buildData } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats, applyFormat } from './useFormats'

export function useSheet() {
  const [sheet, ops] = useJson(SheetSchema, loadInitial(), { history: 100 })
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [findOpen, setFindOpen] = useState(false)
  const [findMode, setFindMode] = useState<'find' | 'replace'>('find')

  const fmt = useFormats()

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const display = (k: string) => applyFormat(evaluateCell(sheet.cells, sheet.cells[k] ?? ''), fmt.formatOf(k))
  const data = buildData((k) => display(k))
  data.meta = { ...data.meta, focus: focusId }
  for (const id of selectedIds) {
    data.entities[id] = { ...(data.entities[id] ?? {}), selected: true }
  }

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

  useShortcuts({
    editing, focusId, sheet, ops, writeCell, startEdit, selectedIds,
    openFind: () => { setFindMode('find'); setFindOpen(true) },
    openReplace: () => { setFindMode('replace'); setFindOpen(true) },
  })

  const focusCell = focusId ? parseCellId(focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  const highlightedIds = (editing && draft.startsWith('='))
    ? refsInFormula(draft).map((ref) => {
        const m = /^([A-J])(\d+)$/.exec(ref)
        if (!m || !COL_LETTERS.includes(m[1] as (typeof COL_LETTERS)[number])) return ''
        return `r${Number(m[2]) - 1}-${m[1]}`
      }).filter(Boolean)
    : []

  return {
    sheet, ops, data,
    focusId, setFocusId,
    editing, draft, setDraft,
    startEdit, commitEdit, cancelEdit,
    writeCell, display,
    focusKey,
    selectedIds, setSelectedIds,
    highlightedIds,
    findOpen, setFindOpen, findMode,
    setFormat: fmt.setFormat,
    formatOf: fmt.formatOf,
  }
}
