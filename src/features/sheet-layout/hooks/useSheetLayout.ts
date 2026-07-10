import { setColumnWidth } from './useColWidths'
import { useRowHeights } from './useRowHeights'
import type { Sheet, SheetOps } from '../../../entities/Sheet/schema'
import type { RecordMutationCommands } from '../../../shared/lib/dictOps'

export interface SheetLayoutPrompts {
  promptRowHeight?: (row: number) => void
  promptColWidth?: (col: string) => void
  promptFilter?: (col: string) => void
}

const noop = () => {}

interface SheetLayoutMutationCommands {
  rowHeights: RecordMutationCommands<number>
  colWidths: RecordMutationCommands<number>
}

export function useSheetLayout(sheet: Sheet, ops: SheetOps, prompts: SheetLayoutPrompts, recordMutations?: SheetLayoutMutationCommands) {
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
