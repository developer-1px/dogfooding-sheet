import { Toolbar } from './Toolbar'
import type { Ask } from './usePrompt'
import type { Confirm } from './useConfirm'
import type { Display, Sheet, SheetOps, WriteCell, WriteMany } from './schema'
import type { Format, FormatLookup } from './formatting/useFormats'
import type { CellStyle, StyleLookup } from './formatting/useStyles'
import type { SheetMutations } from './structure/sheetMutations'
import type { FreezeActions, FreezeState } from './visibility/useFreeze'
import type { Filter } from './visibility/useFilter'
import type { HiddenActions } from './visibility/useHidden'
import type { ValidationActions } from './validation/useValidation'
import type { CondActions } from './formatting/useCondFormat'
import { applyPatch } from '../lib/dictOps'
import { clearAllFormatsPatch, clearCellValuesPatch } from './toolbarActions'

interface SheetToolbarController
  extends SheetMutations,
  ValidationActions,
  CondActions,
  FreezeActions,
  Pick<HiddenActions, 'showAll'> {
  display: Display
  writeCell: WriteCell
  writeCells: WriteMany
  focusKey: string | null
  selectedIds: string[]
  setFormat: (keys: string[], format: Format) => void
  formatOf: FormatLookup
  updateStyle: (keys: string[], patch: Partial<CellStyle>) => void
  styleOf: StyleLookup
  freeze: FreezeState
  filter: Filter | null
  applyFilter: (col: string, text: string) => void
  clearFilter: () => void
  hasHidden: boolean
  setHelpOpen: (open: boolean) => void
  insertLink: () => void
  sheet: Sheet
  ops: Pick<SheetOps, 'replace' | 'undo' | 'redo' | 'canUndo' | 'canRedo' | 'patch'>
  showFormulas: boolean
  toggleShowFormulas: () => void
  showGridlines: boolean
  toggleShowGridlines: () => void
  mergeSelection: () => void
  rowCount: number
  colCount: number
}

export function SheetToolbar({ ctx, ask, confirm }: { ctx: SheetToolbarController; ask: Ask; confirm: Confirm }) {
  return (
    <Toolbar
      display={ctx.display}
      writeCell={ctx.writeCell}
      writeCells={ctx.writeCells}
      focusKey={ctx.focusKey}
      selectedIds={ctx.selectedIds}
      setFormat={ctx.setFormat}
      formatOf={ctx.formatOf}
      insertRow={ctx.insertRow}
      deleteRow={ctx.deleteRow}
      insertCol={ctx.insertCol}
      deleteCol={ctx.deleteCol}
      appendRows={ctx.appendRows}
      appendCols={ctx.appendCols}
      sortByCol={ctx.sortByCol}
      updateStyle={ctx.updateStyle}
      styleOf={ctx.styleOf}
      freeze={ctx.freeze}
      toggleFreezeRows={ctx.toggleFreezeRows}
      toggleFreezeCols={ctx.toggleFreezeCols}
      setFreezeRows={ctx.setFreezeRows}
      setFreezeCols={ctx.setFreezeCols}
      filter={ctx.filter}
      applyFilter={ctx.applyFilter}
      clearFilter={ctx.clearFilter}
      hasHidden={ctx.hasHidden}
      showAll={ctx.showAll}
      setListRule={ctx.setListRule}
      setCheckboxRule={ctx.setCheckboxRule}
      clearRule={ctx.clearRule}
      openHelp={() => ctx.setHelpOpen(true)}
      insertLink={ctx.insertLink}
      addCondRule={ctx.addCondRule}
      clearCondRules={ctx.clearCondRules}
      sheet={ctx.sheet}
      resetSheet={(s) => ctx.ops.replace('', s)}
      clearCellValues={() => applyPatch(ctx.ops, clearCellValuesPatch(ctx.sheet.cells))}
      undo={() => ctx.ops.undo()}
      redo={() => ctx.ops.redo()}
      canUndo={ctx.ops.canUndo()}
      canRedo={ctx.ops.canRedo()}
      showFormulas={ctx.showFormulas}
      toggleShowFormulas={ctx.toggleShowFormulas}
      showGridlines={ctx.showGridlines}
      toggleShowGridlines={ctx.toggleShowGridlines}
      clearAllFormats={() => applyPatch(ctx.ops, clearAllFormatsPatch(ctx.sheet))}
      mergeSelection={ctx.mergeSelection}
      rowCount={ctx.rowCount}
      colCount={ctx.colCount}
      ask={ask}
      confirm={confirm}
    />
  )
}
