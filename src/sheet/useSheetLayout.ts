import { setColumnWidth } from './grid-view/useColWidths'
import { useRowHeights } from './grid-view/useRowHeights'
import type { Sheet, SheetOps } from './schema'
import type { SheetRecordMutationCommands } from './useSheetDocument'

export interface SheetLayoutPrompts {
  promptRowHeight?: (row: number) => void
  promptColWidth?: (col: string) => void
  promptFilter?: (col: string) => void
}

const noop = () => {}

export function useSheetLayout(sheet: Sheet, ops: SheetOps, prompts: SheetLayoutPrompts, recordMutations?: Pick<SheetRecordMutationCommands, 'rowHeights' | 'colWidths'>) {
  const rowHeights = useRowHeights(sheet.rowHeights, ops, { rowCount: sheet.rowCount }, recordMutations?.rowHeights)

  return {
    rowHeightOf: rowHeights.heightOf,
    setRowHeight: rowHeights.setHeight,
    onRowResize: rowHeights.onResize,
    onRowResizeEnd: rowHeights.onResizeEnd,
    resetRowHeight: rowHeights.resetRowHeight,
    promptRowHeight: prompts.promptRowHeight ?? noop,
    promptColWidth: prompts.promptColWidth ?? noop,
    promptFilter: prompts.promptFilter ?? noop,
    setColWidth: (col: string, width: number) => {
      setColumnWidth(ops, sheet.colWidths, col, width, { colCount: sheet.colCount }, recordMutations?.colWidths)
    },
  }
}
