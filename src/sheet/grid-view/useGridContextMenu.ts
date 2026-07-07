import { useContextMenuGesture } from '@interactive-os/aria-kernel/gesture'
import { idsForCol, idsForRow } from '@spredsheet/grid'
import { cellId } from '../schema'
import { useCellMenu } from '../useCellMenu'
import type { GridContextMenuController } from './gridController'

export function useGridContextMenu(ctx: GridContextMenuController) {
  const cellMenu = useCellMenu({
    sheet: ctx.sheet,
    rowCount: ctx.rowCount,
    colLetters: ctx.colLetters,
    hiddenRows: ctx.hiddenRows,
    hiddenCols: ctx.hiddenCols,
    filterCol: ctx.filter?.col ?? null,
    clearFilter: ctx.clearFilter,
    setFocusId: ctx.setFocusId,
    writeCell: ctx.writeCell,
    clipboardText: ctx.clipboardText,
    insertRow: ctx.insertRow,
    deleteRow: ctx.deleteRow,
    insertCol: ctx.insertCol,
    deleteCol: ctx.deleteCol,
    appendRows: ctx.appendRows,
    appendCols: ctx.appendCols,
    sortByCol: ctx.sortByCol,
    noteOf: ctx.noteOf,
    setNote: ctx.setNote,
    hideCol: ctx.hideCol,
    hideRow: ctx.hideRow,
    showRow: ctx.showRow,
    showCol: ctx.showCol,
    editNote: ctx.editNote,
    insertLink: ctx.insertLink,
    promptRowHeight: ctx.promptRowHeight,
    promptColWidth: ctx.promptColWidth,
    promptFilter: ctx.promptFilter,
    setFreezeRows: ctx.setFreezeRows,
    setFreezeCols: ctx.setFreezeCols,
    freeze: ctx.freeze,
    mergeSelection: ctx.mergeSelection,
  })
  const cellCtx = useContextMenuGesture<string>({ onOpen: (id, x, y) => cellMenu.open(x, y, id) })

  const onHeaderContextMenu = (e: React.MouseEvent, col: string) => {
    e.preventDefault()
    const id = cellId(col, 0)
    ctx.setSelectedIds(idsForCol(col, ctx.rowCount))
    ctx.setSelectAnchor(id)
    cellMenu.openCol(e.clientX, e.clientY, id)
  }

  const onRowHeaderContextMenu = (row: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    const id = cellId('A', row)
    ctx.setSelectedIds(idsForRow(row, ctx.colLetters))
    ctx.setSelectAnchor(id)
    cellMenu.openRow(e.clientX, e.clientY, id)
  }

  return {
    cellMenu,
    getCellCtxHandlers: cellCtx.getHandlers,
    onHeaderContextMenu,
    onRowHeaderContextMenu,
  }
}
