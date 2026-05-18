import { useContextMenuGesture } from '@interactive-os/aria-kernel/gesture'
import { parseCellId, cellKey, cellId } from '../schema'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { useColWidths } from './useColWidths'
import { ContextMenu } from '../ContextMenu'
import { useCellMenu } from '../useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from '../fill/useAutoFill'
import { idsForCol, idsForRow, rectToIdSet } from '@spredsheet/grid'
import { freezeOffsets } from './freezeOffsets'; import { buildMergeMap } from '../structure/useMerges'
import type { SheetCtx } from '../useSheet'



export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, inputProps, selectProps, focusId, selectedIds, setSelectedIds, setSelectAnchor, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol, styleOf, noteOf, setNote, ruleOf, condBgOf, insertCol, deleteCol, freeze, hiddenRowSet, hiddenRows: hiddenRowsManual, hiddenCols, hideRow, hideCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, colLetters: ctx.colLetters, hiddenRows: hiddenRowsManual, hiddenCols, filterCol: ctx.filter?.col ?? null, clearFilter: ctx.clearFilter, setFocusId, writeCell, insertRow, deleteRow, insertCol, deleteCol, appendRows: ctx.appendRows, appendCols: ctx.appendCols, sortByCol, noteOf, setNote, hideCol, hideRow, showRow: ctx.showRow, showCol: ctx.showCol, editNote: ctx.editNote, insertLink: ctx.insertLink, promptRowHeight: ctx.promptRowHeight, promptColWidth: ctx.promptColWidth, setFreezeRows: ctx.setFreezeRows, setFreezeCols: ctx.setFreezeCols, freeze, mergeSelection: ctx.mergeSelection })
  // useContextMenuGesture#156 — getHandlers(id) factory: hook 1회 + N개 핸들러.
  // contextmenu(우클릭) + Shift+F10/ContextMenu 키 둘 다 동일 onOpen으로 흡수.
  const cellCtx = useContextMenuGesture<string>({ onOpen: (id, x, y) => cellMenu.open(x, y, id) })
  const onHeaderContextMenu = (e: React.MouseEvent, col: string) => {
    e.preventDefault()
    setSelectedIds(idsForCol(col, ctx.rowCount))
    cellMenu.openCol(e.clientX, e.clientY, cellId(col, 0))
  }
  const onRowHCtx = (rIdx: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedIds(idsForRow(rIdx, ctx.colLetters))
    cellMenu.openRow(e.clientX, e.clientY, cellId('A', rIdx))
  }
  const fill = useAutoFill({ selectedIds, focusId, cells: sheet.cells, writeCell, writeCells: ctx.writeCells, setSelectedIds, rowCount: ctx.rowCount, colLetters: ctx.colLetters }); const previewIds = rectToIdSet(fill.preview)
  const { rootProps, rowProps, columnHeaderProps, cellProps, rows, getCellHandlers } = useSheetGrid({ data, rowCount: ctx.rowCount, colCount: ctx.colLetters.length, setFocusId, setSelectedIds, setSelectAnchor, startEdit, isEditing: () => editing !== null })
  const { gridTemplateFor, onResize, onResizeEnd, autoFit, widthOf } = useColWidths(ctx.sheet.colWidths, ctx.ops)
  const autoFitCol = (c: string) => autoFit(c, Array.from({ length: ctx.rowCount }, (_, r) => ctx.display(cellKey(c, r))))
  const focusP = focusId ? parseCellId(focusId) : null
  const focusCol = focusP ? focusP.col : null; const focusRow = focusP ? focusP.row : null
  const visibleCols = ctx.colLetters.filter((c) => !hiddenCols.has(c))
  const { tops: freezeTops, lefts: freezeLefts } = freezeOffsets(freeze.rows, freeze.cols, ctx.rowHeightOf, widthOf); const mergeMap = buildMergeMap(ctx.merges)
  const gridTemplate = gridTemplateFor(visibleCols); const dataRows = rows

  return (
    <div {...rootProps} className={`grid${ctx.showGridlines ? '' : ' no-gridlines'}`}>
      <GridHeader
        gridTemplate={gridTemplate}
        columnHeaderProps={columnHeaderProps}
        widthOf={widthOf}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        autoFitCol={autoFitCol}
        setSelectedIds={setSelectedIds}
        hiddenCols={hiddenCols}
        showCol={ctx.showCol}
        filterCol={ctx.filter?.col ?? null}
        focusCol={focusCol}
        onHeaderContextMenu={onHeaderContextMenu}
        rowCount={ctx.rowCount}
        colLetters={ctx.colLetters}
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
            heightOf={ctx.rowHeightOf} onResize={ctx.onRowResize} onResizeEnd={ctx.onRowResizeEnd} resetRowHeight={ctx.resetRowHeight} onRowHeaderContextMenu={onRowHCtx(rIdx)} mergeAnchors={mergeMap.anchors} mergeHidden={mergeMap.hidden}
            hiddenCols={hiddenCols}
            hiddenRows={hiddenRowsManual}
            showRow={ctx.showRow}
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
            onFormulaPickKeyDown={(e) => {
              if (e.key === 'F4' && ctx.formulaPickActive) {
                e.preventDefault()
                e.stopPropagation()
                ctx.cycleFormulaRef()
                return
              }
              const delta =
                e.key === 'ArrowUp' ? { dRow: -1, dCol: 0 }
                  : e.key === 'ArrowDown' ? { dRow: 1, dCol: 0 }
                    : e.key === 'ArrowLeft' ? { dRow: 0, dCol: -1 }
                      : e.key === 'ArrowRight' ? { dRow: 0, dCol: 1 }
                        : null
              if (!delta || !ctx.formulaPickActive) return
              e.preventDefault()
              e.stopPropagation()
              ctx.moveFormulaPick(delta, e.shiftKey)
            }}
            onCellMouseDown={(id, e) => {
              const target = e.target as Element
              if (ctx.formulaPickActive && editing && e.button === 0 && !target.closest('.cell-input')) {
                e.preventDefault()
                e.stopPropagation()
                ctx.pickFormulaRef(id, { extend: e.shiftKey })
                return
              }
              getCellHandlers(id).onMouseDown(e)
            }}
            onCellMouseEnter={(id, e) => fill.dragging ? fill.onCellEnterDuringFill(id) : getCellHandlers(id).onMouseEnter(e)}
            onFillHandleMouseDown={fill.onHandleMouseDown}
            getCellCtxHandlers={cellCtx.getHandlers}
            inputProps={inputProps}
            selectProps={selectProps}
            colLetters={ctx.colLetters}
          />
        )
      })}
      {cellMenu.menu && (
        <ContextMenu
          x={cellMenu.menu.x}
          y={cellMenu.menu.y}
          items={cellMenu.items(cellMenu.menu.cellId, cellMenu.menu.kind)}
          onClose={cellMenu.close}
        />
      )}
    </div>
  )
}
