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
import { useSheetViewState } from './useSheetViewState'

export interface SheetOptions extends SheetLayoutPrompts {
  openGoto?: () => void
  openNote?: (key?: string) => void
  openLink?: () => void
}

export function useSheet(opts: SheetOptions = {}) {
  const {
    sheet,
    ops,
    writeCell,
    writeCells,
    toggleCheckboxCell,
    replaceCellsByQuery,
    replaceCellText,
    moveCollectionBefore,
    moveCollectionAfter,
    previewSheetReplacement,
    applySheetReplacement,
    clearCellValues,
    clearAllFormats,
    recordMutations,
    freezeMutations,
    hiddenMutations,
    clipboardText,
    persistence,
  } = useSheetDocument()
  const rowCount = sheet.rowCount
  const colLetters = colLettersFor(sheet.colCount)
  const fmt = useFormats(sheet.formats, ops, { rowCount, colCount: sheet.colCount }, recordMutations.formats)
  const styles = useStyles(sheet.styles, ops, { rowCount, colCount: sheet.colCount }, recordMutations.styles)
  const freeze = useFreeze(sheet.freeze, ops, { rowCount, colCount: sheet.colCount }, freezeMutations)
  const filter = useFilter()
  const hidden = useHidden(sheet.hidden, ops, { rowCount, colCount: sheet.colCount }, hiddenMutations)
  const notes = useNotes(sheet.notes, ops, { rowCount, colCount: sheet.colCount }, recordMutations.notes)
  const validation = useValidation(sheet.validation, sheet.cells, ops, { rowCount, colCount: sheet.colCount }, recordMutations.validation)
  const cond = useCondFormat(sheet.condFormat, ops, { colCount: sheet.colCount })
  const layout = useSheetLayout(sheet, ops, opts, recordMutations)
  const merges = useMerges(sheet.merges, ops, { rowCount, colCount: sheet.colCount })
  const find = useFindState()
  const viewState = useSheetViewState()
  const tabs = useTabs(sheet.tabs, ops)
  const tabFns = tabActions(sheet, {
    replace: (path, value) => ops.replace(path, value),
    replaceSheet: (next) => { ops.replace('', next) },
    moveBefore: moveCollectionBefore,
    moveAfter: moveCollectionAfter,
  })

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
    showFormulas: viewState.showFormulas,
    formatOf: fmt.formatOf,
    filter: filter.filter,
    focusId: edit.focusId,
    selectedIds,
    selectAnchor: selection.selectAnchor,
  })

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops)

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
    clipboardText,
    selectedIds,
    setSelectedIds,
    setFocusId,
    setSelectAnchor,
    targetKeys,
    openFind: find.openFind,
    openReplace: find.openReplace,
    openHelp: viewState.openHelp,
    openGoto: opts.openGoto ?? (() => {}),
    insertLink: opts.openLink ?? (() => {}),
    editNote: opts.openNote ?? (() => {}),
    updateStyle: styles.updateStyle,
    styleOf: styles.styleOf,
    setFormat: fmt.setFormat,
    display,
    toggleShowFormulas: viewState.toggleShowFormulas,
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
    sheet, ops, persistence, data,
    recordMutations,
    ...edit,
    commitEdit, cancelEdit,
    writeCell, writeCells, toggleCheckboxCell, replaceCellsByQuery, replaceCellText, previewSheetReplacement, applySheetReplacement, clearCellValues, clearAllFormats, clipboardText, display,
    selectedIds, setSelectedIds, setFocusId, setSelectAnchor,
    highlightedIds: highlightedIdsFor(edit.editing, edit.draft),
    formulaPickActive: formulaPick.formulaPickActive,
    pickFormulaRef: formulaPick.pickFormulaRef,
    moveFormulaPick: formulaPick.moveFormulaPick,
    cycleFormulaRef: formulaPick.cycleFormulaRef,
    findOpen: find.findOpen, setFindOpen: find.setFindOpen, findMode: find.findMode,
    helpOpen: viewState.helpOpen,
    setHelpOpen: viewState.setHelpOpen,
    showFormulas: viewState.showFormulas,
    toggleShowFormulas: viewState.toggleShowFormulas,
    showGridlines: viewState.showGridlines,
    toggleShowGridlines: viewState.toggleShowGridlines,
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
