import { COL_LETTERS, ROW_COUNT } from './schema'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { useDragSelect } from './useDragSelect'
import { useColWidths } from './useColWidths'
import { ContextMenu } from './ContextMenu'
import { useCellMenu } from './useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from './useAutoFill'
import { rectToIdSet } from '../lib/rect'
import { freezeOffsets } from '../lib/freezeOffsets'; import { buildMergeMap } from './useMerges'
import { parseCellId, cellKey } from '../lib/a1'
import type { SheetCtx } from './useSheet'



export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputProps, selectProps, focusId, selectedIds, setSelectedIds, setSelectAnchor, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol, styleOf, noteOf, setNote, ruleOf, condBgOf, insertCol, deleteCol, freeze, hiddenRowSet, hiddenRows: hiddenRowsManual, hiddenCols, hideRow, hideCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, insertCol, deleteCol, sortByCol, noteOf, setNote, hideCol, hideRow, editNote: ctx.editNote, insertLink: ctx.insertLink, promptRowHeight: ctx.promptRowHeight, promptColWidth: ctx.promptColWidth, setFreezeRows: ctx.setFreezeRows, setFreezeCols: ctx.setFreezeCols, freeze, mergeSelection: ctx.mergeSelection })
  const onHeaderContextMenu = (e: React.MouseEvent, col: string) => { e.preventDefault(); cellMenu.open(e, `r0-${col}`) }; const onRowHCtx = (rIdx: number) => (e: React.MouseEvent) => { e.preventDefault(); cellMenu.open(e, `r${rIdx}-A`) }
  const fill = useAutoFill({ selectedIds, focusId, cells: sheet.cells, writeCell, writeCells: ctx.writeCells, setSelectedIds }); const previewIds = rectToIdSet(fill.preview)
  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useSheetGrid({ data, setFocusId, setSelectedIds, setSelectAnchor, startEdit, isEditing: () => editing !== null })

  const drag = useDragSelect({ focusId, setFocusId, setSelectedIds })
  const { gridTemplateFor, startResize, autoFit, widthOf } = useColWidths(ctx.sheet.colWidths, ctx.ops)
  const autoFitCol = (c: string) => autoFit(c, Array.from({ length: ROW_COUNT }, (_, r) => ctx.display(cellKey(c, r))))
  const focusP = focusId ? parseCellId(focusId) : null
  const focusCol = focusP ? focusP.col : null; const focusRow = focusP ? focusP.row : null
  const visibleCols = COL_LETTERS.filter((c) => !hiddenCols.has(c))
  const { tops: freezeTops, lefts: freezeLefts } = freezeOffsets(freeze.rows, freeze.cols, ctx.rowHeightOf, widthOf); const mergeMap = buildMergeMap(ctx.merges)
  const gridTemplate = gridTemplateFor(visibleCols); const dataRows = rows

  return (
    <div {...rootProps} className={`grid${ctx.showGridlines ? '' : ' no-gridlines'}`}>
      <GridHeader
        gridTemplate={gridTemplate}
        columnHeaderProps={columnHeaderProps}
        startResize={startResize}
        autoFitCol={autoFitCol}
        setSelectedIds={setSelectedIds}
        hiddenCols={hiddenCols}
        focusCol={focusCol}
        onHeaderContextMenu={onHeaderContextMenu}
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
            rowCls={`grid-row${rIdx < freeze.rows ? ' freeze-row' : ''}${focusRow === rIdx ? ' active-row' : ''}`}
            freezeTop={rIdx < freeze.rows ? freezeTops[rIdx] : undefined}
            freezeCols={freeze.cols}
            freezeLefts={freezeLefts}
            rowHeight={ctx.rowHeightOf(rIdx)}
            startResizeRow={ctx.startResizeRow} resetRowHeight={ctx.resetRowHeight} onRowHeaderContextMenu={onRowHCtx(rIdx)} mergeAnchors={mergeMap.anchors} mergeHidden={mergeMap.hidden}
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
            rawOf={(k) => sheet.cells[k]}
            ruleOf={ruleOf}
            writeCell={writeCell}
            condBgOf={condBgOf}
            hiSet={hiSet}
            previewIds={previewIds}
            onCellMouseDown={(id, e) => drag.onMouseDown(id, e)}
            onCellMouseEnter={(id) => fill.dragging ? fill.onCellEnterDuringFill(id) : drag.onMouseEnter(id)}
            onFillHandleMouseDown={fill.onHandleMouseDown}
            onCellContextMenu={(e, id) => cellMenu.open(e, id)}
            inputProps={inputProps}
            selectProps={selectProps}
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
