import { useEffect, useRef } from 'react'
import { COL_LETTERS } from './schema'
import { idsForRow } from './range'
import { Cell } from './Cell'
import { GridHeader } from './GridHeader'
import { useDragSelect } from './useDragSelect'
import { useColWidths } from './useColWidths'
import { ContextMenu } from './ContextMenu'
import { useCellMenu } from './useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from './useAutoFill'
import { isFillCorner, rectToIdSet } from './fillCorner'
import { styleToProps } from './useStyles'
import type { useSheet } from './useSheet'

type SheetCtx = ReturnType<typeof useSheet>

export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, focusId, selectedIds, setSelectedIds, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol, styleOf, freeze } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, sortByCol })
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
  const { gridTemplate, startResize } = useColWidths()
  const dataRows = rows.slice(COL_LETTERS.length)

  return (
    <div {...rootProps} className="grid">
      <GridHeader
        gridTemplate={gridTemplate}
        columnHeaderProps={columnHeaderProps}
        startResize={startResize}
        setSelectedIds={setSelectedIds}
      />
      {dataRows.map((row, rIdx) => {
        const rowCls = `grid-row${freeze.rows && rIdx === 0 ? ' freeze-row' : ''}`
        return (
        <div key={row.id} {...rowProps(row.id)} className={rowCls} style={{ gridTemplateColumns: gridTemplate }}>
          <span className="row-header" onClick={() => setSelectedIds(idsForRow(rIdx))}>{rIdx + 1}</span>
          {row.cells.map((cell, cIdx) => {
            const m = /^r(\d+)-([A-J])$/.exec(cell.id)
            const k = m ? `${m[2]}${Number(m[1]) + 1}` : ''
            const extra = freeze.cols && cIdx === 0 ? ' freeze-col' : ''
            return (
            <Cell
              key={cell.id}
              cellProps={cellProps(cell.id)}
              label={cell.label}
              selected={cell.selected}
              focused={focusId === cell.id}
              highlighted={hiSet.has(cell.id)}
              isNum={cell.label !== '' && !Number.isNaN(Number(cell.label))}
              styleClass={styleToProps(styleOf(k)).className + extra}
              styleInline={styleToProps(styleOf(k)).style}
              editing={editing === cell.id}
              draft={draft}
              setDraft={setDraft}
              onCommit={commitEdit}
              onCancel={cancelEdit}
              onStartEdit={() => startEdit(cell.id)}
              onMouseDown={(e) => drag.onMouseDown(cell.id, e)}
              onMouseEnter={() => { fill.dragging ? fill.onCellEnterDuringFill(cell.id) : drag.onMouseEnter(cell.id) }}
              isFillCorner={isFillCorner(cell.id, focusId, selectedIds)}
              onFillHandleMouseDown={fill.onHandleMouseDown}
              previewing={previewIds.has(cell.id)}
              onContextMenu={(e) => cellMenu.open(e, cell.id)}
              ref={editing === cell.id ? inputRef : null}
            />
          )})}
        </div>
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
