import { cellKey } from '../schema'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { useColWidths } from './useColWidths'
import { ContextMenu } from '../ContextMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from '../fill/useAutoFill'
import { fillSourceRect, rectToIdSet } from '@spredsheet/grid'
import { freezeOffsets } from './freezeOffsets'
import { buildMergeMap } from '../structure/useMerges'
import { createGridViewModel } from './gridViewModel'
import { formulaPickDeltaForKey } from './formulaPickKeys'
import { useGridContextMenu } from './useGridContextMenu'
import type { GridController } from './gridController'

export function Grid({ ctx }: { ctx: GridController }) {
  const {
    data,
    setFocusId,
    editing,
    draft,
    setDraft,
    startEdit,
    commitEdit,
    cancelEdit,
    inputProps,
    selectProps,
    focusId,
    selectedIds,
    setSelectedIds,
    setSelectAnchor,
    highlightedIds,
    sheet,
    writeCell,
    toggleCheckboxCell,
    styleOf,
    noteOf,
    ruleOf,
    condBgOf,
    freeze,
    hiddenRowSet,
    hiddenRows: hiddenRowsManual,
    hiddenCols,
  } = ctx
  const hiSet = new Set(highlightedIds)
  const { cellMenu, getCellCtxHandlers, onHeaderContextMenu, onRowHeaderContextMenu } = useGridContextMenu(ctx)
  const fill = useAutoFill({
    selectedIds,
    focusId,
    cells: sheet.cells,
    writeCell,
    writeCells: ctx.writeCells,
    setSelectedIds,
    rowCount: ctx.rowCount,
    colLetters: ctx.colLetters,
  })
  const fillSource = fillSourceRect(selectedIds, focusId)
  const previewIds = rectToIdSet(fill.preview)
  const { rootProps, rowProps, columnHeaderProps, cellProps, rows, getCellHandlers } = useSheetGrid({
    data,
    rowCount: ctx.rowCount,
    colCount: ctx.colLetters.length,
    setFocusId,
    setSelectedIds,
    setSelectAnchor,
    startEdit,
    isEditing: () => editing !== null,
  })
  const { gridTemplateFor, onResize, onResizeEnd, autoFit, widthOf } = useColWidths(ctx.sheet.colWidths, ctx.ops, { colCount: ctx.colLetters.length })
  function* columnSamples(c: string): IterableIterator<string> {
    for (let row = 0; row < ctx.rowCount; row++) yield ctx.display(cellKey(c, row))
  }
  const autoFitCol = (c: string) => {
    autoFit(c, columnSamples(c))
  }
  const view = createGridViewModel({
    focusId,
    selectedIds,
    rowCount: ctx.rowCount,
    colLetters: ctx.colLetters,
    hiddenCols,
  })
  const { tops: freezeTops, lefts: freezeLefts } = freezeOffsets(freeze.rows, freeze.cols, ctx.rowHeightOf, widthOf)
  const mergeMap = buildMergeMap(ctx.merges)
  const gridTemplate = gridTemplateFor(view.visibleCols)

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
        setFocusId={setFocusId}
        setSelectAnchor={setSelectAnchor}
        hiddenCols={hiddenCols}
        showCol={ctx.showCol}
        filterCol={ctx.filter?.col ?? null}
        focusCol={view.focusCol}
        selectedCols={view.selectedCols}
        allSelected={view.allSelected}
        onHeaderContextMenu={onHeaderContextMenu}
        rowCount={ctx.rowCount}
        colLetters={ctx.colLetters}
      />
      {rows.map((row, rIdx) => {
        if (hiddenRowSet.has(rIdx) || hiddenRowsManual.has(rIdx)) return null
        return (
          <GridRow
            key={row.id}
            rIdx={rIdx}
            rowItemProps={row}
            rowProps={rowProps(row.id)}
            cellPropsFor={cellProps}
            gridTemplate={gridTemplate}
            rowCls={`grid-row${rIdx < freeze.rows ? ' freeze-row' : ''}${view.focusRow === rIdx ? ' active-row' : ''}`}
            freezeTop={rIdx < freeze.rows ? freezeTops[rIdx] : undefined}
            freezeCols={freeze.cols}
            freezeLefts={freezeLefts}
            rowHeight={ctx.rowHeightOf(rIdx)}
            heightOf={ctx.rowHeightOf}
            onResize={ctx.onRowResize}
            onResizeEnd={ctx.onRowResizeEnd}
            resetRowHeight={ctx.resetRowHeight}
            onRowHeaderContextMenu={onRowHeaderContextMenu(rIdx)}
            mergeAnchors={mergeMap.anchors}
            mergeHidden={mergeMap.hidden}
            hiddenCols={hiddenCols}
            hiddenRows={hiddenRowsManual}
            showRow={ctx.showRow}
            selectedRows={view.selectedRows}
            setFocusId={setFocusId}
            setSelectAnchor={setSelectAnchor}
            focusId={focusId}
            fillSourceRect={fillSource}
            editing={editing}
            draft={draft}
            setDraft={setDraft}
            setSelectedIds={setSelectedIds}
            startEdit={startEdit}
            commitEdit={commitEdit}
            cancelEdit={cancelEdit}
            styleOf={styleOf}
            noteOf={noteOf}
            rawOf={(k) => sheet.cells[k]}
            ruleOf={ruleOf}
            toggleCheckboxCell={toggleCheckboxCell}
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
              const delta = formulaPickDeltaForKey(e.key)
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
            onCellMouseEnter={(id) => {
              if (fill.dragging) fill.onCellEnterDuringFill(id)
              else getCellHandlers(id).onMouseEnter()
            }}
            onFillHandleMouseDown={fill.onHandleMouseDown}
            getCellCtxHandlers={getCellCtxHandlers}
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
          label={cellMenu.label(cellMenu.menu.kind)}
          items={cellMenu.items(cellMenu.menu.cellId, cellMenu.menu.kind)}
          onClose={cellMenu.close}
        />
      )}
    </div>
  )
}
