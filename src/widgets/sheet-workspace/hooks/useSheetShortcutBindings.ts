import { exportCsvBounded, MAX_CSV_EXPORT_LENGTH } from '../../../shared/lib/csv'
import { downloadFile } from '../../../shared/lib/downloadFile'
import type { FillCellRange, Sheet, SheetOps, WriteCell, WriteCellRange, WriteMany, Display } from '../../../entities/Sheet/schema'
import { CLEAR_STYLE, type CellStyle } from '../../../features/formatting/hooks/useStyles'
import { rowColAtFocus } from '../../../features/structure/model/rowColAtFocus'
import { mergeSelection } from '../../../features/structure/model/mergeSelection'
import { useShortcuts } from './useShortcuts'
import type { ClipboardTextBridge } from '../../../features/clipboard/model/clipboardActions'

interface Args {
  editing: string | null
  focusId: string | null
  focusKey: string | null
  startEdit: (id: string, initial?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  sheet: Sheet
  rowCount: number
  colLetters: readonly string[]
  ops: SheetOps
  writeCell: WriteCell
  writeCells: WriteMany
  writeCellRange: WriteCellRange
  fillCellRange: FillCellRange
  clipboardText?: ClipboardTextBridge
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
  targetKeys: () => string[]
  openFind: () => void
  openReplace: () => void
  openHelp: () => void
  openGoto: () => void
  insertLink: () => void
  editNote: () => void
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
  styleOf: (key: string) => CellStyle | undefined
  setFormat: (keys: string[], format: 'plain' | 'currency' | 'percent' | 'date') => void
  display: Display
  toggleShowFormulas: () => void
  cycleTab: (delta: 1 | -1) => void
  insertRow: (row: number) => void
  deleteRow: (row: number) => void
  insertCol: (col: string) => void
  deleteCol: (col: string) => void
  hideRow: (row: number) => void
  hideCol: (col: string) => void
  showAll: () => void
  addMerge: (merge: [number, number, number, number]) => void
  unmergeAt: (row: number, col: number) => void
}

export function useSheetShortcutBindings(args: Args) {
  const toggleStyle = (key: 'b' | 'i' | 'u' | 's') => {
    args.updateStyle(args.targetKeys(), { [key]: !(args.focusKey && args.styleOf(args.focusKey)?.[key]) })
  }

  useShortcuts({
    editing: args.editing,
    focusId: args.focusId,
    sheet: args.sheet,
    rowCount: args.rowCount,
    colLetters: args.colLetters,
    ops: args.ops,
    writeCell: args.writeCell,
    writeCells: args.writeCells,
    writeCellRange: args.writeCellRange,
    fillCellRange: args.fillCellRange,
    clipboardText: args.clipboardText,
    startEdit: args.startEdit,
    selectedIds: args.selectedIds,
    openFind: args.openFind,
    openReplace: args.openReplace,
    openHelp: args.openHelp,
    openGoto: args.openGoto,
    insertLink: args.insertLink,
    toggleBold: () => toggleStyle('b'),
    toggleItalic: () => toggleStyle('i'),
    toggleUnderline: () => toggleStyle('u'),
    toggleStrike: () => toggleStyle('s'),
    clearFormat: () => args.updateStyle(args.targetKeys(), CLEAR_STYLE),
    saveCsv: () => {
      const csv = exportCsvBounded(args.display, { rowCount: args.rowCount, colLetters: args.colLetters, maxLength: MAX_CSV_EXPORT_LENGTH })
      if (csv !== null) downloadFile('sheet.csv', csv)
    },
    setSelectedIds: args.setSelectedIds,
    setFocusId: args.setFocusId,
    setSelectAnchor: args.setSelectAnchor,
    switchTab: args.cycleTab,
    display: args.display,
    applyFormat: (format) => args.setFormat(args.targetKeys(), format),
    editNote: args.editNote,
    toggleShowFormulas: args.toggleShowFormulas,
    mergeSelection: () => mergeSelection(args.selectedIds, args.focusId, args),
    ...rowColAtFocus(args.focusKey, {
      insertRow: args.insertRow,
      deleteRow: args.deleteRow,
      insertCol: args.insertCol,
      deleteCol: args.deleteCol,
      hideRow: args.hideRow,
      hideCol: args.hideCol,
    }),
    showAll: args.showAll,
  })
}
