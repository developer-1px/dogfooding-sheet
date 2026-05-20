import { useEffect, useMemo, useState } from 'react'
import { useJSONDocument } from 'zod-crud'
import { SheetSchema, colLettersFor, type Writes } from './schema'
import { loadInitial, saveSheet } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats } from './formatting/useFormats'
import { CLEAR_STYLE } from './formatting/useStyles'
import { useStyles } from './formatting/useStyles'
import { useFreeze } from './visibility/useFreeze'
import { useFilter } from './visibility/useFilter'
import { useHidden } from './visibility/useHidden'
import { useNotes } from './useNotes'
import { normalizeCheckboxValue, useValidation } from './validation/useValidation'
import { useCondFormat } from './formatting/useCondFormat'
import { exportCsv, downloadFile } from '../lib/csv'
import { sheetMutations } from './structure/sheetMutations'
import { useFindState, highlightedIdsFor } from './find/useFindState'
import { useTabs, tabActions } from './tabs/useTabs'
import { useEditState } from './useEditState'
import { rowColAtFocus } from './structure/rowColAtFocus'
import { useRowHeights } from './grid-view/useRowHeights'; import { DEFAULT_WIDTH } from './grid-view/useColWidths'; import { upsertKey, type Patch } from '../lib/dictOps'; import { useMerges } from './structure/useMerges'; import { mergeSelection } from './structure/mergeSelection'; import { writeCellsBatch } from './writeCells'
import { useFormulaPick } from './useFormulaPick'
import { useSheetSelection } from './useSheetSelection'
import { useSheetPresentation } from './useSheetPresentation'

export type SheetCtx = ReturnType<typeof useSheet>

export function useSheet(opts: { openGoto?: () => void; openNote?: (key?: string) => void; openLink?: () => void; promptRowHeight?: (row: number) => void; promptColWidth?: (col: string) => void; promptFilter?: (col: string) => void } = {}) {
  const doc = useJSONDocument(SheetSchema, loadInitial(), { history: 100 })
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
  const selection = useSheetSelection(edit)
  const { selectedIds, setSelectedIds, setFocusId, setSelectAnchor, targetKeys } = selection
  const formulaPick = useFormulaPick({ edit, rowCount, colLetters, setSelectedIds, setSelectAnchor })

  const commitEdit = (move?: { dRow: number; dCol: number }) => {
    const wasPicking = formulaPick.formulaPickActive
    edit.commitEdit(move)
    if (wasPicking) {
      formulaPick.clearFormulaPick()
      setSelectedIds([])
    }
  }

  const cancelEdit = () => {
    const wasPicking = formulaPick.formulaPickActive
    edit.cancelEdit()
    if (wasPicking) {
      formulaPick.clearFormulaPick()
      setSelectedIds([])
    }
  }

  const { display, data, hiddenRowSet } = useSheetPresentation({
    cells: sheet.cells, rowCount, colLetters, showFormulas, formatOf: fmt.formatOf,
    filter: filter.filter, focusId: edit.focusId, selectedIds, selectAnchor: selection.selectAnchor,
  })

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops)

  const setCheckboxRule = (keys: string[]) => {
    const patch: Patch = []
    for (const k of keys) {
      const rulePath = `/validation/${k}`
      const value = normalizeCheckboxValue(sheet.cells[k])
      if (sheet.validation[k] === undefined) patch.push({ op: 'add', path: rulePath, value: { type: 'checkbox' } })
      else if (sheet.validation[k]?.type !== 'checkbox') patch.push({ op: 'replace', path: rulePath, value: { type: 'checkbox' } })
      const cellPath = `/cells/${k}`
      if (sheet.cells[k] === undefined) patch.push({ op: 'add', path: cellPath, value })
      else if (sheet.cells[k] !== value) patch.push({ op: 'replace', path: cellPath, value })
    }
    if (patch.length) ops.patch(patch as never)
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
    setSelectedIds, setFocusId, setSelectAnchor, switchTab: tabFns.cycleTab, display, applyFormat: (f) => fmt.setFormat(targetKeys(), f), editNote: opts.openNote ?? (() => {}),
    toggleShowFormulas, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    ...rowColAtFocus(edit.focusKey, { insertRow, deleteRow, insertCol, deleteCol, hideRow: hidden.hideRow, hideCol: hidden.hideCol }), showAll: hidden.showAll,
  })

  return {
    sheet, ops, data,
    ...edit,
    commitEdit, cancelEdit,
    writeCell, writeCells, display,
    selectedIds, setSelectedIds, setFocusId, setSelectAnchor,
    highlightedIds: highlightedIdsFor(edit.editing, edit.draft),
    formulaPickActive: formulaPick.formulaPickActive,
    pickFormulaRef: formulaPick.pickFormulaRef,
    moveFormulaPick: formulaPick.moveFormulaPick,
    cycleFormulaRef: formulaPick.cycleFormulaRef,
    findOpen: find.findOpen, setFindOpen: find.setFindOpen, findMode: find.findMode,
    helpOpen, setHelpOpen,
    showFormulas, toggleShowFormulas, showGridlines, toggleShowGridlines: () => setShowGridlines((v) => !v),
    setFormat: fmt.setFormat, formatOf: fmt.formatOf,
    updateStyle: styles.updateStyle, styleOf: styles.styleOf,
    freeze: freeze.freeze, toggleFreezeRows: freeze.toggleRows, toggleFreezeCols: freeze.toggleCols, setFreezeRows: freeze.setFreezeRows, setFreezeCols: freeze.setFreezeCols, filter: filter.filter, applyFilter: filter.apply, clearFilter: filter.clear,
    rowCount, colCount: sheet.colCount, colLetters,
    hiddenRowSet,
    hidden: hidden.hidden, hiddenRows: hidden.rowSet, hiddenCols: hidden.colSet,
    hideRow: hidden.hideRow, hideCol: hidden.hideCol, showRow: hidden.showRow, showCol: hidden.showCol, showAll: hidden.showAll, hasHidden: hidden.hasHidden,
    setNote: notes.setNote, noteOf: notes.noteOf, editNote: opts.openNote ?? (() => {}), insertLink: opts.openLink ?? (() => {}),
    setListRule: validation.setListRule, setCheckboxRule, clearRule: validation.clearRule, ruleOf: validation.ruleOf,
    condBgOf: cond.bgFor, addCondRule: cond.addRule, clearCondRules: cond.clearAll,
    insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol,
    rowHeightOf: rowH.heightOf, setRowHeight: rowH.setHeight, onRowResize: rowH.onResize, onRowResizeEnd: rowH.onResizeEnd, resetRowHeight: rowH.resetRowHeight, promptRowHeight: opts.promptRowHeight ?? (() => {}), promptColWidth: opts.promptColWidth ?? (() => {}), promptFilter: opts.promptFilter ?? (() => {}), setColWidth: (col: string, w: number) => upsertKey(ops, '/colWidths', sheet.colWidths, col, w === DEFAULT_WIDTH ? undefined : Math.max(40, Math.round(w))), merges: sheet.merges, addMerge: merges.addMerge, unmergeAt: merges.unmergeAt, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    tabs: tabs.state, ...tabFns,
  }
}
