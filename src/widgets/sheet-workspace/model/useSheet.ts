import { colLettersFor } from '../../../entities/Sheet/schema'
import { useFormats } from '../../../features/formatting/hooks/useFormats'
import { useStyles } from '../../../features/formatting/hooks/useStyles'
import { useFreeze } from '../../../features/visibility/hooks/useFreeze'
import { useFilter } from '../../../features/visibility/hooks/useFilter'
import { useHidden } from '../../../features/visibility/hooks/useHidden'
import { useNotes } from '../../../features/notes/hooks/useNotes'
import { useValidation } from '../../../features/validation/hooks/useValidation'
import { useCondFormat } from '../../../features/formatting/hooks/useCondFormat'
import { sheetMutations } from '../../../features/structure/model/sheetMutations'
import { useFindState } from '../../../features/find/hooks/useFindState'
import { formulaReferenceDecorationsFor } from '../../../features/selection/model/formulaReferenceDecorations'
import { useTabs, tabActions } from '../../../features/tabs/hooks/useTabs'
import { useEditState } from '../../../features/editing/hooks/useEditState'
import { useMerges } from '../../../features/structure/hooks/useMerges'
import { mergeSelection } from '../../../features/structure/model/mergeSelection'
import { useFormulaPick } from '../../../features/formula-pick/hooks/useFormulaPick'
import { useSheetSelection } from '../../../features/selection/hooks/useSheetSelection'
import { useSheetPresentation } from '../../sheet-grid/model/useSheetPresentation'
import { useSheetShortcutBindings } from '../hooks/useSheetShortcutBindings'
import { useSheetDocument } from '../hooks/useSheetDocument'
import { useSheetLayout, type SheetLayoutPrompts } from '../../../features/sheet-layout/hooks/useSheetLayout'
import { useSheetViewState } from '../../../features/sheet-view/hooks/useSheetViewState'

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
    writeCellRange,
    fillCellRange,
    toggleCheckboxCell,
    replaceCellsByQuery,
    replaceCellText,
    moveCollectionBefore,
    moveCollectionAfter,
    previewSheetReplacement,
    applySheetReplacement,
    writeTabColor,
    clearTabColor,
    clearCellValues,
    clearAllFormats,
    recordMutations,
    condFormatMutations,
    mergeMutations,
    countMutations,
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
  const cond = useCondFormat(sheet.condFormat, ops, { colCount: sheet.colCount }, condFormatMutations)
  const layout = useSheetLayout(sheet, ops, opts, recordMutations)
  const merges = useMerges(sheet.merges, ops, { rowCount, colCount: sheet.colCount }, mergeMutations)
  const find = useFindState()
  const viewState = useSheetViewState()
  const tabsOps = {
    replace: (_path: '/tabs', value: typeof sheet.tabs) => { if (!applySheetReplacement({ ...sheet, tabs: value }, 'tabs-diff')) ops.replace('/tabs', value) },
  }
  const tabs = useTabs(sheet.tabs, tabsOps)
  const tabFns = tabActions(sheet, {
    replace: tabsOps.replace,
    replaceSheet: (next) => { if (!applySheetReplacement(next, 'tab-action')) ops.replace('', next) },
    moveBefore: moveCollectionBefore,
    moveAfter: moveCollectionAfter,
    setTabColor: writeTabColor,
    clearTabColor,
  })

  const edit = useEditState({ cells: sheet.cells, writeCell, rowCount, colLetters })
  const selection = useSheetSelection(edit)
  const { selectedIds, setSelectedIds, setFocusId, setSelectAnchor, targetKeys } = selection
  const formulaPick = useFormulaPick({ edit, rowCount, colLetters, setSelectedIds, setSelectAnchor })

  const commitEdit = (move?: { dRow: number; dCol: number }, opts?: { restoreFocus?: boolean; draft?: string }) => {
    const wasPicking = formulaPick.formulaPickActive
    edit.commitEdit(move, opts)
    if (wasPicking) {
      formulaPick.clearFormulaPick()
      setSelectedIds([])
    }
  }

  const cancelEdit = (opts?: { restoreFocus?: boolean }) => {
    const wasPicking = formulaPick.formulaPickActive
    edit.cancelEdit(opts)
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
  const formulaReferences = formulaReferenceDecorationsFor(edit.editing, edit.draft, { rowCount, colLetters })

  const { insertRow, deleteRow, insertCol, deleteCol, appendRows, appendCols, sortByCol } = sheetMutations(sheet, ops, countMutations)

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
    writeCellRange,
    fillCellRange,
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
    writeCell, writeCells, writeCellRange, fillCellRange, toggleCheckboxCell, replaceCellsByQuery, replaceCellText, previewSheetReplacement, applySheetReplacement, clearCellValues, clearAllFormats, clipboardText, display,
    selectedIds, setSelectedIds, setFocusId, setSelectAnchor,
    highlightedIds: formulaReferences.highlightedIds,
    formulaReferenceById: formulaReferences.byId,
    formulaReferenceText: formulaReferences.text,
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
