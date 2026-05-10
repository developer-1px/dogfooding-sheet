import { useEffect, useState } from 'react'
import { useJson } from 'zod-crud'
import { SheetSchema, cellKey, parseCellId } from './schema'
import { evaluateCell } from './formula'
import { loadInitial, saveSheet, moveCellId, buildData } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats, applyFormat } from './useFormats'
import { useStyles } from './useStyles'
import { insertRow as insertRowOp, deleteRow as deleteRowOp } from './rowOps'
import { sortByColumn } from './sortOps'
import { useFindState, highlightedIdsFor } from './useFindState'
import { useTabs, tabActions } from './useTabs'

export function useSheet() {
  const [sheet, ops] = useJson(SheetSchema, loadInitial(), { history: 100 })
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const fmt = useFormats()
  const styles = useStyles()
  const find = useFindState()
  const tabs = useTabs(sheet.cells)
  const tabFns = tabActions(tabs.state, tabs.setState, sheet.cells, (c) => ops.reset({ cells: c }))

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const display = (k: string) => applyFormat(evaluateCell(sheet.cells, sheet.cells[k] ?? ''), fmt.formatOf(k))
  const data = buildData((k) => display(k))
  data.meta = { ...data.meta, focus: focusId }
  for (const id of selectedIds) data.entities[id] = { ...(data.entities[id] ?? {}), selected: true }

  const writeCell = (k: string, v: string) => {
    if (v === '') {
      if (sheet.cells[k] !== undefined) ops.remove(`/cells/${k}` as never)
    } else if (sheet.cells[k] === undefined) ops.add(`/cells/${k}` as never, v as never)
    else if (sheet.cells[k] !== v) ops.replace(`/cells/${k}` as never, v as never)
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

  const insertRow = (atRow: number) => ops.replace('/cells' as never, insertRowOp(sheet.cells, atRow) as never)
  const deleteRow = (atRow: number) => ops.replace('/cells' as never, deleteRowOp(sheet.cells, atRow) as never)
  const sortByCol = (col: string, dir: 'asc' | 'desc') =>
    ops.replace('/cells' as never, sortByColumn(sheet.cells, { col, dir }) as never)

  useShortcuts({
    editing, focusId, sheet, ops, writeCell, startEdit, selectedIds,
    openFind: find.openFind, openReplace: find.openReplace,
  })

  const focusCell = focusId ? parseCellId(focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null

  return {
    sheet, ops, data,
    focusId, setFocusId,
    editing, draft, setDraft,
    startEdit, commitEdit, cancelEdit: () => setEditing(null),
    writeCell, display, focusKey,
    selectedIds, setSelectedIds,
    highlightedIds: highlightedIdsFor(editing, draft),
    findOpen: find.findOpen, setFindOpen: find.setFindOpen, findMode: find.findMode,
    setFormat: fmt.setFormat, formatOf: fmt.formatOf,
    updateStyle: styles.updateStyle, styleOf: styles.styleOf,
    insertRow, deleteRow, sortByCol,
    tabs: tabs.state, ...tabFns,
  }
}
