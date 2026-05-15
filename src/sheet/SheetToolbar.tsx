import { Toolbar } from './Toolbar'
import type { Ask } from './usePrompt'
import type { Confirm } from './useConfirm'
import type { SheetCtx } from './useSheet'

type Ctx = SheetCtx

export function SheetToolbar({ ctx, ask, confirm }: { ctx: Ctx; ask: Ask; confirm: Confirm }) {
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
      resetSheet={(s) => ctx.ops.reset(s)}
      resetCells={(c) => ctx.ops.replace('/cells', c)}
      undo={() => ctx.ops.undo()}
      redo={() => ctx.ops.redo()}
      canUndo={ctx.ops.canUndo()}
      canRedo={ctx.ops.canRedo()}
      showFormulas={ctx.showFormulas}
      toggleShowFormulas={ctx.toggleShowFormulas}
      showGridlines={ctx.showGridlines}
      toggleShowGridlines={ctx.toggleShowGridlines}
      clearAllFormats={() => ctx.ops.patch([
        { op: 'replace', path: '/styles', value: {} },
        { op: 'replace', path: '/formats', value: {} },
        { op: 'replace', path: '/condFormat', value: [] },
      ])}
      mergeSelection={ctx.mergeSelection}
      ask={ask}
      confirm={confirm}
    />
  )
}
