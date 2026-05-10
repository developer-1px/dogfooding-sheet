import { useEffect, useState } from 'react'
import { useJsonDocument } from 'zod-crud'
import { SheetSchema, ROW_COUNT } from './schema'
import { evaluateCell } from '../lib/formula'
import { loadInitial, saveSheet, buildData } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats, applyFormat } from './useFormats'
import { useStyles } from './useStyles'
import { useFreeze } from './useFreeze'
import { useFilter, hiddenRows } from './useFilter'
import { useHidden } from './useHidden'
import { useNotes } from './useNotes'
import { useValidation } from './useValidation'
import { useCondFormat } from './useCondFormat'
import { cellIdToKey } from '../lib/a1'
import { exportCsv, downloadFile } from '../lib/csv'
import { sheetMutations } from './sheetMutations'
import { useFindState, highlightedIdsFor } from './useFindState'
import { useTabs, tabActions } from './useTabs'
import { useEditState } from './useEditState'

export function useSheet(opts: { openGoto?: () => void; openNote?: () => void } = {}) {
  const { value: sheet, ops } = useJsonDocument(SheetSchema, loadInitial(), { history: 100 })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const fmt = useFormats()
  const styles = useStyles()
  const freeze = useFreeze()
  const filter = useFilter()
  const hidden = useHidden()
  const notes = useNotes(sheet.notes, ops)
  const validation = useValidation()
  const cond = useCondFormat()
  const find = useFindState()
  const [helpOpen, setHelpOpen] = useState(false)
  const tabs = useTabs(sheet.cells)
  const tabFns = tabActions(tabs.state, tabs.setState, sheet.cells, (c) => ops.reset({ cells: c, notes: sheet.notes }))

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const writeCell = (k: string, v: string) => {
    if (v === '' && sheet.cells[k] !== undefined) ops.remove(`/cells/${k}`)
    else if (v !== '' && sheet.cells[k] === undefined) ops.add(`/cells/${k}`, v)
    else if (v !== '' && sheet.cells[k] !== v) ops.replace(`/cells/${k}`, v)
  }

  const edit = useEditState({ cells: sheet.cells, writeCell })

  const display = (k: string) => applyFormat(evaluateCell(sheet.cells, sheet.cells[k] ?? ''), fmt.formatOf(k))
  const data = buildData((k) => display(k))
  data.meta = { ...data.meta, focus: edit.focusId }
  for (const id of selectedIds) data.entities[id] = { ...(data.entities[id] ?? {}), selected: true }

  const { insertRow, deleteRow, insertCol, deleteCol, sortByCol } = sheetMutations(sheet, ops)

  const targetKeys = (): string[] => {
    const ids = selectedIds.length > 0 ? selectedIds : (edit.focusKey ? [edit.focusKey] : [])
    return ids.map((id) => id.includes('-') ? cellIdToKey(id) : id)
  }
  const toggle = (k: 'b' | 'i' | 'u') => styles.updateStyle(targetKeys(), { [k]: !(edit.focusKey && styles.styleOf(edit.focusKey)?.[k]) })

  useShortcuts({
    editing: edit.editing, focusId: edit.focusId, sheet, ops, writeCell,
    startEdit: edit.startEdit, selectedIds,
    openFind: find.openFind, openReplace: find.openReplace,
    openHelp: () => setHelpOpen(true),
    openGoto: opts.openGoto ?? (() => {}),
    toggleBold: () => toggle('b'),
    toggleItalic: () => toggle('i'),
    toggleUnderline: () => toggle('u'),
    clearFormat: () => styles.updateStyle(targetKeys(), { b: false, i: false, u: false, a: undefined, bg: '', fg: '' }),
    saveCsv: () => downloadFile('sheet.csv', exportCsv(display, { rowCount: ROW_COUNT })),
    setSelectedIds, setFocusId: edit.setFocusId, switchTab: tabFns.cycleTab, display, applyFormat: (f) => fmt.setFormat(targetKeys(), f), editNote: opts.openNote ?? (() => {}),
  })

  return {
    sheet, ops, data,
    ...edit,
    writeCell, display,
    selectedIds, setSelectedIds,
    highlightedIds: highlightedIdsFor(edit.editing, edit.draft),
    findOpen: find.findOpen, setFindOpen: find.setFindOpen, findMode: find.findMode,
    helpOpen, setHelpOpen,
    setFormat: fmt.setFormat, formatOf: fmt.formatOf,
    updateStyle: styles.updateStyle, styleOf: styles.styleOf,
    freeze: freeze.freeze, toggleFreezeRows: freeze.toggleRows, toggleFreezeCols: freeze.toggleCols, filter: filter.filter, applyFilter: filter.apply, clearFilter: filter.clear,
    hiddenRowSet: hiddenRows(filter.filter, ROW_COUNT, display),
    hidden: hidden.hidden, hiddenRows: hidden.rowSet, hiddenCols: hidden.colSet,
    hideRow: hidden.hideRow, hideCol: hidden.hideCol, showAll: hidden.showAll, hasHidden: hidden.hasHidden,
    setNote: notes.setNote, noteOf: notes.noteOf, editNote: opts.openNote ?? (() => {}),
    setListRule: validation.setListRule, setCheckboxRule: validation.setCheckboxRule, clearRule: validation.clearRule, ruleOf: validation.ruleOf,
    condBgOf: cond.bgFor, addCondRule: cond.addRule, clearCondRules: cond.clearAll,
    insertRow, deleteRow, insertCol, deleteCol, sortByCol,
    tabs: tabs.state, ...tabFns,
  }
}
