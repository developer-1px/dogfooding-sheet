import { useEffect, useMemo, useState } from 'react'
import { useJsonDocument } from 'zod-crud'
import { SheetSchema, colLettersFor, cellIdToKey, type Writes } from './schema'
import { evaluateCell } from '@spredsheet/formula'
import { loadInitial, saveSheet, buildData } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats, applyFormat } from './useFormats'
import { CLEAR_STYLE } from './useStyles'
import { useStyles } from './useStyles'
import { useFreeze } from './useFreeze'
import { useFilter, hiddenRows } from './useFilter'
import { useHidden } from './useHidden'
import { useNotes } from './useNotes'
import { useValidation } from './useValidation'
import { useCondFormat } from './useCondFormat'
import { exportCsv, downloadFile } from '../lib/csv'
import { sheetMutations } from './sheetMutations'
import { useFindState, highlightedIdsFor } from './useFindState'
import { useTabs, tabActions } from './useTabs'
import { useEditState } from './useEditState'
import { rowColAtFocus } from '../lib/rowColAtFocus'
import { useRowHeights } from './useRowHeights'; import { DEFAULT_WIDTH } from './useColWidths'; import { upsertKey } from '../lib/dictOps'; import { useMerges } from './useMerges'; import { mergeSelection } from '../lib/mergeSelection'; import { writeCellsBatch } from './writeCells'

export type SheetCtx = ReturnType<typeof useSheet>

export function useSheet(opts: { openGoto?: () => void; openNote?: (key?: string) => void; openLink?: () => void; promptRowHeight?: (row: number) => void; promptColWidth?: (col: string) => void } = {}) {
  const doc = useJsonDocument(SheetSchema, loadInitial(), { history: 100 })
  const { value: sheet } = doc
  const rowCount = sheet.rowCount
  const colLetters = colLettersFor(sheet.colCount)
  const ops = useMemo(() => ({
    ...doc.ops,
    undo: () => doc.commands.undo(),
    redo: () => doc.commands.redo(),
    canUndo: () => doc.history.canUndo,
    canRedo: () => doc.history.canRedo,
  }), [doc.commands, doc.history, doc.ops])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAnchor, setSelectAnchor] = useState<string | null>(null)
  const fmt = useFormats(sheet.formats, ops)
  const styles = useStyles(sheet.styles, ops)
  const freeze = useFreeze(sheet.freeze, ops)
  const filter = useFilter()
  const hidden = useHidden(sheet.hidden, ops)
  const notes = useNotes(sheet.notes, ops)
  const validation = useValidation(sheet.validation, ops)
  const cond = useCondFormat(sheet.condFormat, ops); const rowH = useRowHeights(sheet.rowHeights, ops); const merges = useMerges(sheet.merges, ops)
  const find = useFindState()
  const [helpOpen, setHelpOpen] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false); const [showGridlines, setShowGridlines] = useState(true)
  const tabs = useTabs(sheet.tabs, ops)
  const tabFns = tabActions(sheet, ops)

  useEffect(() => { saveSheet(sheet) }, [sheet])

  const writeCell = (k: string, v: string) => upsertKey(ops, '/cells', sheet.cells, k, v === '' ? undefined : v)
  const writeCells = (writes: Writes) => writeCellsBatch(ops, sheet.cells, writes)

  const edit = useEditState({ cells: sheet.cells, writeCell, rowCount, colLetters })

  const display = (k: string) => showFormulas ? (sheet.cells[k] ?? '') : applyFormat(evaluateCell(sheet.cells, sheet.cells[k] ?? ''), fmt.formatOf(k))
  const data = buildData((k) => display(k), rowCount, colLetters)
  data.meta = { ...data.meta, focus: edit.focusId, selectAnchor: selectAnchor ?? undefined }
  for (const id of selectedIds) data.entities[id] = { ...(data.entities[id] ?? {}), selected: true }

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops)

  const targetKeys = (): string[] => {
    const ids = selectedIds.length > 0 ? selectedIds : (edit.focusKey ? [edit.focusKey] : [])
    return ids.map(cellIdToKey)
  }
  const toggle = (k: 'b' | 'i' | 'u' | 's') => styles.updateStyle(targetKeys(), { [k]: !(edit.focusKey && styles.styleOf(edit.focusKey)?.[k]) })
  const toggleShowFormulas = () => setShowFormulas((v) => !v)

  useShortcuts({
    editing: edit.editing, focusId: edit.focusId, sheet, rowCount, colLetters, ops, writeCell, writeCells,
    startEdit: edit.startEdit, selectedIds,
    openFind: find.openFind, openReplace: find.openReplace,
    openHelp: () => setHelpOpen(true), openGoto: opts.openGoto ?? (() => {}), insertLink: opts.openLink ?? (() => {}),
    toggleBold: () => toggle('b'), toggleItalic: () => toggle('i'), toggleUnderline: () => toggle('u'), toggleStrike: () => toggle('s'),
    clearFormat: () => styles.updateStyle(targetKeys(), CLEAR_STYLE),
    saveCsv: () => downloadFile('sheet.csv', exportCsv(display, { rowCount, colLetters })),
    setSelectedIds, setFocusId: edit.setFocusId, switchTab: tabFns.cycleTab, display, applyFormat: (f) => fmt.setFormat(targetKeys(), f), editNote: opts.openNote ?? (() => {}),
    toggleShowFormulas, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    ...rowColAtFocus(edit.focusKey, { insertRow, deleteRow, insertCol, deleteCol, hideRow: hidden.hideRow, hideCol: hidden.hideCol }), showAll: hidden.showAll,
  })

  return {
    sheet, ops, data,
    ...edit,
    writeCell, writeCells, display,
    selectedIds, setSelectedIds, setSelectAnchor,
    highlightedIds: highlightedIdsFor(edit.editing, edit.draft),
    findOpen: find.findOpen, setFindOpen: find.setFindOpen, findMode: find.findMode,
    helpOpen, setHelpOpen,
    showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines: () => setShowGridlines((v) => !v),
    setFormat: fmt.setFormat, formatOf: fmt.formatOf,
    updateStyle: styles.updateStyle, styleOf: styles.styleOf,
    freeze: freeze.freeze, toggleFreezeRows: freeze.toggleRows, toggleFreezeCols: freeze.toggleCols, setFreezeRows: freeze.setFreezeRows, setFreezeCols: freeze.setFreezeCols, filter: filter.filter, applyFilter: filter.apply, clearFilter: filter.clear,
    rowCount, colCount: sheet.colCount, colLetters,
    hiddenRowSet: hiddenRows(filter.filter, rowCount, display),
    hidden: hidden.hidden, hiddenRows: hidden.rowSet, hiddenCols: hidden.colSet,
    hideRow: hidden.hideRow, hideCol: hidden.hideCol, showAll: hidden.showAll, hasHidden: hidden.hasHidden,
    setNote: notes.setNote, noteOf: notes.noteOf, editNote: opts.openNote ?? (() => {}), insertLink: opts.openLink ?? (() => {}),
    setListRule: validation.setListRule, setCheckboxRule: validation.setCheckboxRule, clearRule: validation.clearRule, ruleOf: validation.ruleOf,
    condBgOf: cond.bgFor, addCondRule: cond.addRule, clearCondRules: cond.clearAll,
    insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol,
    rowHeightOf: rowH.heightOf, setRowHeight: rowH.setHeight, onRowResize: rowH.onResize, onRowResizeEnd: rowH.onResizeEnd, resetRowHeight: rowH.resetRowHeight, promptRowHeight: opts.promptRowHeight ?? (() => {}), promptColWidth: opts.promptColWidth ?? (() => {}), setColWidth: (col: string, w: number) => upsertKey(ops, '/colWidths', sheet.colWidths, col, w === DEFAULT_WIDTH ? undefined : Math.max(40, Math.round(w))), merges: sheet.merges, addMerge: merges.addMerge, unmergeAt: merges.unmergeAt, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    tabs: tabs.state, ...tabFns,
  }
}
