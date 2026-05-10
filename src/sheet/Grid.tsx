import { COL_LETTERS, ROW_COUNT } from './schema'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { useDragSelect } from './useDragSelect'
import { useColWidths } from './useColWidths'
import { ContextMenu } from './ContextMenu'
import { useCellMenu } from './useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from './useAutoFill'
import { rectToIdSet } from './fillCorner'
import type { useSheet } from './useSheet'

type SheetCtx = ReturnType<typeof useSheet>

export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputProps, focusId, selectedIds, setSelectedIds, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol, styleOf, noteOf, setNote, ruleOf, condBgOf, insertCol, deleteCol, freeze, hiddenRowSet, hiddenRows: hiddenRowsManual, hiddenCols, hideRow, hideCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, insertCol, deleteCol, sortByCol, noteOf, setNote })
  const fill = useAutoFill({ selectedIds, focusId, cells: sheet.cells, writeCell, setSelectedIds })
  const previewIds = rectToIdSet(fill.preview)

  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useSheetGrid({ data, setFocusId, setSelectedIds, startEdit })

  const drag = useDragSelect({ focusId, setFocusId, setSelectedIds })
  const { gridTemplateFor, startResize, autoFit } = useColWidths()
  const autoFitCol = (c: string) => autoFit(c, Array.from({ length: ROW_COUNT }, (_, r) => ctx.display(`${c}${r + 1}`)))
  const visibleCols = COL_LETTERS.filter((c) => !hiddenCols.has(c))
  const gridTemplate = gridTemplateFor(visibleCols)
  // useGridPattern.rows already filters out childless entities (column headers).
  const dataRows = rows

  return (
    <div {...rootProps} className="grid">
      <GridHeader
        gridTemplate={gridTemplate}
        columnHeaderProps={columnHeaderProps}
        startResize={startResize}
        autoFitCol={autoFitCol}
        setSelectedIds={setSelectedIds}
        hiddenCols={hiddenCols}
        hideCol={hideCol}
      />
      {dataRows.map((row, rIdx) => {
        if (hiddenRowSet.has(rIdx) || hiddenRowsManual.has(rIdx)) return null
        return (
          <GridRow
            key={row.id}
            rIdx={rIdx}
            rowItemProps={row}
            rowProps={rowProps(row.id)}
            cellPropsFor={cellProps}
            gridTemplate={gridTemplate}
            rowCls={`grid-row${freeze.rows && rIdx === 0 ? ' freeze-row' : ''}`}
            freezeFirstCol={!!freeze.cols}
            hiddenCols={hiddenCols}
            focusId={focusId}
            selectedIds={selectedIds}
            editing={editing}
            draft={draft}
            setDraft={setDraft}
            setSelectedIds={setSelectedIds}
            startEdit={startEdit}
            commitEdit={commitEdit}
            cancelEdit={cancelEdit}
            hideRow={hideRow}
            styleOf={styleOf}
            noteOf={noteOf}
            ruleOf={ruleOf}
            condBgOf={condBgOf}
            hiSet={hiSet}
            previewIds={previewIds}
            onCellMouseDown={(id, e) => drag.onMouseDown(id, e)}
            onCellMouseEnter={(id) => fill.dragging ? fill.onCellEnterDuringFill(id) : drag.onMouseEnter(id)}
            onFillHandleMouseDown={fill.onHandleMouseDown}
            onCellContextMenu={(e, id) => cellMenu.open(e, id)}
            inputProps={inputProps}
          />
        )
      })}
      {cellMenu.menu && (
        <ContextMenu
          x={cellMenu.menu.x}
          y={cellMenu.menu.y}
          items={cellMenu.items(cellMenu.menu.cellId)}
          onClose={cellMenu.close}
        />
      )}
    </div>
  )
}
