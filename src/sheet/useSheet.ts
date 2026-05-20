import { useState } from 'react'
import { colLettersFor } from './schema'
import { useFormats } from './formatting/useFormats'
import { useStyles } from './formatting/useStyles'
import { useFreeze } from './visibility/useFreeze'
import { useFilter } from './visibility/useFilter'
import { useHidden } from './visibility/useHidden'
import { useNotes } from './useNotes'
import { useValidation } from './validation/useValidation'
import { useCondFormat } from './formatting/useCondFormat'
import { sheetMutations } from './structure/sheetMutations'
import { useFindState, highlightedIdsFor } from './find/useFindState'
import { useTabs, tabActions } from './tabs/useTabs'
import { useEditState } from './useEditState'
import { useMerges } from './structure/useMerges'
import { mergeSelection } from './structure/mergeSelection'
import { useFormulaPick } from './useFormulaPick'
import { useSheetSelection } from './useSheetSelection'
import { useSheetPresentation } from './useSheetPresentation'
import { useSheetShortcutBindings } from './useSheetShortcutBindings'
import { useSheetDocument } from './useSheetDocument'
import { useSheetLayout, type SheetLayoutPrompts } from './useSheetLayout'

export type SheetCtx = ReturnType<typeof useSheet>

interface SheetOptions extends SheetLayoutPrompts {
  openGoto?: () => void
  openNote?: (key?: string) => void
  openLink?: () => void
}

export function useSheet(opts: SheetOptions = {}) {
  const { sheet, ops, writeCell, writeCells } = useSheetDocument()
  const rowCount = sheet.rowCount
  const colLetters = colLettersFor(sheet.colCount)
  const fmt = useFormats(sheet.formats, ops)
  const styles = useStyles(sheet.styles, ops)
  const freeze = useFreeze(sheet.freeze, ops)
  const filter = useFilter()
  const hidden = useHidden(sheet.hidden, ops)
  const notes = useNotes(sheet.notes, ops)
  const validation = useValidation(sheet.validation, sheet.cells, ops)
  const cond = useCondFormat(sheet.condFormat, ops)
  const layout = useSheetLayout(sheet, ops, opts)
  const merges = useMerges(sheet.merges, ops)
  const find = useFindState()
  const [helpOpen, setHelpOpen] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)
  const [showGridlines, setShowGridlines] = useState(true)
  const tabs = useTabs(sheet.tabs, ops)
  const tabFns = tabActions(sheet, ops)

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
    cells: sheet.cells,
    rowCount,
    colLetters,
    showFormulas,
    formatOf: fmt.formatOf,
    filter: filter.filter,
    focusId: edit.focusId,
    selectedIds,
    selectAnchor: selection.selectAnchor,
  })

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops)

  const toggleShowFormulas = () => setShowFormulas((v) => !v)

  useSheetShortcutBindings({
    editing: edit.editing,
    focusId: edit.focusId,
    focusKey: edit.focusKey,
    startEdit: edit.startEdit,
    sheet,
    rowCount,
    colLetters,
    ops,
    writeCell,
    writeCells,
    selectedIds,
    setSelectedIds,
    setFocusId,
    setSelectAnchor,
    targetKeys,
    openFind: find.openFind,
    openReplace: find.openReplace,
    openHelp: () => setHelpOpen(true),
    openGoto: opts.openGoto ?? (() => {}),
    insertLink: opts.openLink ?? (() => {}),
    editNote: opts.openNote ?? (() => {}),
    updateStyle: styles.updateStyle,
    styleOf: styles.styleOf,
    setFormat: fmt.setFormat,
    display,
    toggleShowFormulas,
    cycleTab: tabFns.cycleTab,
    insertRow,
    deleteRow,
    insertCol,
    deleteCol,
    hideRow: hidden.hideRow,
    hideCol: hidden.hideCol,
    showAll: hidden.showAll,
    addMerge: merges.addMerge, unmergeAt: merges.unmergeAt,
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
    freeze: freeze.freeze,
    toggleFreezeRows: freeze.toggleRows,
    toggleFreezeCols: freeze.toggleCols,
    setFreezeRows: freeze.setFreezeRows,
    setFreezeCols: freeze.setFreezeCols,
    filter: filter.filter,
    applyFilter: filter.apply,
    clearFilter: filter.clear,
    rowCount, colCount: sheet.colCount, colLetters,
    hiddenRowSet,
    hidden: hidden.hidden, hiddenRows: hidden.rowSet, hiddenCols: hidden.colSet,
    hideRow: hidden.hideRow,
    hideCol: hidden.hideCol,
    showRow: hidden.showRow,
    showCol: hidden.showCol,
    showAll: hidden.showAll,
    hasHidden: hidden.hasHidden,
    setNote: notes.setNote,
    noteOf: notes.noteOf,
    editNote: opts.openNote ?? (() => {}),
    insertLink: opts.openLink ?? (() => {}),
    setListRule: validation.setListRule,
    setCheckboxRule: validation.setCheckboxRule,
    clearRule: validation.clearRule,
    ruleOf: validation.ruleOf,
    condBgOf: cond.bgFor, addCondRule: cond.addRule, clearCondRules: cond.clearAll,
    insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol,
    ...layout,
    merges: sheet.merges,
    addMerge: merges.addMerge,
    unmergeAt: merges.unmergeAt,
    mergeSelection: () => mergeSelection(selectedIds, edit.focusId, merges),
    tabs: tabs.state,
    ...tabFns,
  }
}
