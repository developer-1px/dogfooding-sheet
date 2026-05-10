import { useEffect, useRef } from 'react'
import { COL_LETTERS } from './schema'
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
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, focusId, selectedIds, setSelectedIds, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol, styleOf, noteOf, setNote, ruleOf, freeze, hiddenRowSet, hiddenRows: hiddenRowsManual, hiddenCols, hideRow, hideCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, sortByCol, noteOf, setNote })
  const fill = useAutoFill({ selectedIds, focusId, cells: sheet.cells, writeCell, setSelectedIds })
  const previewIds = rectToIdSet(fill.preview)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useSheetGrid({ data, setFocusId, setSelectedIds, startEdit })

  const drag = useDragSelect({ focusId, setFocusId, setSelectedIds })
  const { gridTemplateFor, startResize } = useColWidths()
  const visibleCols = COL_LETTERS.filter((c) => !hiddenCols.has(c))
  const gridTemplate = gridTemplateFor(visibleCols)
  const dataRows = rows.slice(COL_LETTERS.length)

  return (
    <div {...rootProps} className="grid">
      <GridHeader
        gridTemplate={gridTemplate}
        columnHeaderProps={columnHeaderProps}
        startResize={startResize}
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
            hiSet={hiSet}
            previewIds={previewIds}
            onCellMouseDown={(id, e) => drag.onMouseDown(id, e)}
            onCellMouseEnter={(id) => fill.dragging ? fill.onCellEnterDuringFill(id) : drag.onMouseEnter(id)}
            onFillHandleMouseDown={fill.onHandleMouseDown}
            onCellContextMenu={(e, id) => cellMenu.open(e, id)}
            inputRef={inputRef}
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
