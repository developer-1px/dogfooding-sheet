import { Toolbar } from './Toolbar'
import type { useSheet } from './useSheet'

type Ctx = ReturnType<typeof useSheet>

export function SheetToolbar({ ctx }: { ctx: Ctx }) {
  return (
    <Toolbar
      display={ctx.display}
      writeCell={ctx.writeCell}
      focusKey={ctx.focusKey}
      selectedIds={ctx.selectedIds}
      setFormat={ctx.setFormat}
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
      filter={ctx.filter}
      applyFilter={ctx.applyFilter}
      clearFilter={ctx.clearFilter}
      hasHidden={ctx.hasHidden}
      showAll={ctx.showAll}
      setListRule={ctx.setListRule}
      setCheckboxRule={ctx.setCheckboxRule}
      clearRule={ctx.clearRule}
      openHelp={() => ctx.setHelpOpen(true)}
      addCondRule={ctx.addCondRule}
      clearCondRules={ctx.clearCondRules}
      cells={ctx.sheet.cells}
      resetCells={(c) => ctx.ops.replace('/cells', c)}
    />
  )
}
