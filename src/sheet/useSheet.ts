import { useCallback, useEffect, useMemo, useState } from 'react'
import { useJSONDocument } from 'zod-crud'
import { SheetSchema, colLettersFor, cellIdToKey, type Writes } from './schema'
import { evaluateCell } from '@spredsheet/formula'
import { loadInitial, saveSheet, buildData, moveCellId } from './storage'
import { useShortcuts } from './useShortcuts'
import { useFormats, applyFormat } from './formatting/useFormats'
import { CLEAR_STYLE } from './formatting/useStyles'
import { useStyles } from './formatting/useStyles'
import { useFreeze } from './visibility/useFreeze'
import { useFilter, hiddenRows } from './visibility/useFilter'
import { useHidden } from './visibility/useHidden'
import { useNotes } from './useNotes'
import { normalizeCheckboxValue, useValidation } from './validation/useValidation'
import { useCondFormat } from './formatting/useCondFormat'
import { exportCsv, downloadFile } from '../lib/csv'
import { sheetMutations } from './structure/sheetMutations'
import { useFindState, highlightedIdsFor } from './find/useFindState'
import { useTabs, tabActions } from './tabs/useTabs'
import { useEditState } from './useEditState'
import { cycleTrailingFormulaRef, idsForFormulaPick, refForFormulaPick, replaceTrailingFormulaRef } from './selection/formulaPick'
import { rowColAtFocus } from './structure/rowColAtFocus'
import { useRowHeights } from './grid-view/useRowHeights'; import { DEFAULT_WIDTH } from './grid-view/useColWidths'; import { upsertKey, type Patch } from '../lib/dictOps'; import { useMerges } from './structure/useMerges'; import { mergeSelection } from './structure/mergeSelection'; import { writeCellsBatch } from './writeCells'

export type SheetCtx = ReturnType<typeof useSheet>

export function useSheet(opts: { openGoto?: () => void; openNote?: (key?: string) => void; openLink?: () => void; promptRowHeight?: (row: number) => void; promptColWidth?: (col: string) => void } = {}) {
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
  const formulaPickActive = edit.editing !== null && edit.draft.startsWith('=')
  const [formulaPickAnchor, setFormulaPickAnchor] = useState<string | null>(null)
  const [formulaPickTarget, setFormulaPickTarget] = useState<string | null>(null)

  const pickFormulaRef = useCallback((id: string, opts: { extend?: boolean } = {}) => {
    if (!formulaPickActive) return
    const anchor = opts.extend && formulaPickAnchor ? formulaPickAnchor : id
    const ref = refForFormulaPick(anchor, id)
    if (!ref) return
    setFormulaPickAnchor(anchor)
    setFormulaPickTarget(id)
    setSelectedIds(idsForFormulaPick(anchor, id))
    setSelectAnchor(anchor)
    edit.setDraft(replaceTrailingFormulaRef(edit.draft, ref))
  }, [edit, formulaPickActive, formulaPickAnchor])

  const moveFormulaPick = useCallback((delta: { dRow: number; dCol: number }, extend = false) => {
    if (!formulaPickActive || !edit.editing) return
    const base = formulaPickTarget ?? formulaPickAnchor ?? edit.editing
    const next = moveCellId(base, delta.dRow, delta.dCol, rowCount, colLetters)
    if (next) pickFormulaRef(next, { extend })
  }, [colLetters, edit.editing, formulaPickActive, formulaPickAnchor, formulaPickTarget, pickFormulaRef, rowCount])

  const cycleFormulaRef = useCallback(() => {
    if (!formulaPickActive) return
    edit.setDraft(cycleTrailingFormulaRef(edit.draft))
  }, [edit, formulaPickActive])

  useEffect(() => {
    if (formulaPickActive) return
    setFormulaPickAnchor(null)
    setFormulaPickTarget(null)
  }, [formulaPickActive])

  const commitEdit = (move?: { dRow: number; dCol: number }) => {
    const wasPicking = formulaPickActive
    edit.commitEdit(move)
    if (wasPicking) {
      setFormulaPickAnchor(null)
      setFormulaPickTarget(null)
      setSelectedIds([])
    }
  }

  const cancelEdit = () => {
    const wasPicking = formulaPickActive
    edit.cancelEdit()
    if (wasPicking) {
      setFormulaPickAnchor(null)
      setFormulaPickTarget(null)
      setSelectedIds([])
    }
  }

  const display = (k: string) => showFormulas ? (sheet.cells[k] ?? '') : applyFormat(evaluateCell(sheet.cells, sheet.cells[k] ?? ''), fmt.formatOf(k))
  const data = buildData((k) => display(k), rowCount, colLetters)
  data.meta = { ...data.meta, focus: edit.focusId, selectAnchor: selectAnchor ?? undefined }
  for (const id of selectedIds) data.entities[id] = { ...(data.entities[id] ?? {}), selected: true }

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops)

  const targetKeys = (): string[] => {
    const ids = selectedIds.length > 0 ? selectedIds : (edit.focusKey ? [edit.focusKey] : [])
    return ids.map(cellIdToKey)
  }
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
    setSelectedIds, setFocusId: edit.setFocusId, setSelectAnchor, switchTab: tabFns.cycleTab, display, applyFormat: (f) => fmt.setFormat(targetKeys(), f), editNote: opts.openNote ?? (() => {}),
    toggleShowFormulas, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    ...rowColAtFocus(edit.focusKey, { insertRow, deleteRow, insertCol, deleteCol, hideRow: hidden.hideRow, hideCol: hidden.hideCol }), showAll: hidden.showAll,
  })

  return {
    sheet, ops, data,
    ...edit,
    commitEdit, cancelEdit,
    writeCell, writeCells, display,
    selectedIds, setSelectedIds, setSelectAnchor,
    highlightedIds: highlightedIdsFor(edit.editing, edit.draft),
    formulaPickActive, pickFormulaRef, moveFormulaPick,
    cycleFormulaRef,
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
    setListRule: validation.setListRule, setCheckboxRule, clearRule: validation.clearRule, ruleOf: validation.ruleOf,
    condBgOf: cond.bgFor, addCondRule: cond.addRule, clearCondRules: cond.clearAll,
    insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol,
    rowHeightOf: rowH.heightOf, setRowHeight: rowH.setHeight, onRowResize: rowH.onResize, onRowResizeEnd: rowH.onResizeEnd, resetRowHeight: rowH.resetRowHeight, promptRowHeight: opts.promptRowHeight ?? (() => {}), promptColWidth: opts.promptColWidth ?? (() => {}), setColWidth: (col: string, w: number) => upsertKey(ops, '/colWidths', sheet.colWidths, col, w === DEFAULT_WIDTH ? undefined : Math.max(40, Math.round(w))), merges: sheet.merges, addMerge: merges.addMerge, unmergeAt: merges.unmergeAt, mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    tabs: tabs.state, ...tabFns,
  }
}
