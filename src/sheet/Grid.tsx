import { useEffect, useRef } from 'react'
import { COL_LETTERS } from './schema'
import { idsForCol, idsForRow, idsForAll } from './range'
import { Cell } from './Cell'
import { useDragSelect } from './useDragSelect'
import { useColWidths } from './useColWidths'
import { ContextMenu } from './ContextMenu'
import { useCellMenu } from './useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import { useAutoFill } from './useAutoFill'
import type { useSheet } from './useSheet'

type SheetCtx = ReturnType<typeof useSheet>

function isFillCorner(cellId: string, focusId: string | null, selectedIds: string[]): boolean {
  if (selectedIds.length > 1) {
    const m = /^r(\d+)-([A-J])$/.exec(cellId)
    if (!m) return false
    let maxR = -1, maxC = -1
    for (const id of selectedIds) {
      const mm = /^r(\d+)-([A-J])$/.exec(id)
      if (!mm) continue
      const r = Number(mm[1]); const c = COL_LETTERS.indexOf(mm[2] as (typeof COL_LETTERS)[number])
      if (r > maxR) maxR = r
      if (c > maxC) maxC = c
    }
    return Number(m[1]) === maxR && COL_LETTERS.indexOf(m[2] as (typeof COL_LETTERS)[number]) === maxC
  }
  return cellId === focusId
}

export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, focusId, selectedIds, setSelectedIds, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, sortByCol })
  const fill = useAutoFill({ selectedIds, focusId, cells: sheet.cells, writeCell, setSelectedIds })
  const previewIds = new Set<string>()
  if (fill.preview) {
    for (let r = fill.preview.rMin; r <= fill.preview.rMax; r++) {
      for (let c = fill.preview.cMin; c <= fill.preview.cMax; c++) previewIds.add(`r${r}-${COL_LETTERS[c]}`)
    }
  }
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
      <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
        <span className="corner-cell" onClick={() => setSelectedIds(idsForAll())} />
        {COL_LETTERS.map((c) => (
          <span
            key={c}
            {...columnHeaderProps(`h-${c}`)}
            className="header-cell"
            onClick={() => setSelectedIds(idsForCol(c))}
          >
            {c}
            <span className="col-resizer" onMouseDown={startResize(c)} />
          </span>
        ))}
      </div>
      {dataRows.map((row, rIdx) => (
        <div key={row.id} {...rowProps(row.id)} className="grid-row" style={{ gridTemplateColumns: gridTemplate }}>
          <span className="row-header" onClick={() => setSelectedIds(idsForRow(rIdx))}>{rIdx + 1}</span>
          {row.cells.map((cell) => (
            <Cell
              key={cell.id}
              cellProps={cellProps(cell.id)}
              label={cell.label}
              selected={cell.selected}
              focused={focusId === cell.id}
              highlighted={hiSet.has(cell.id)}
              isNum={cell.label !== '' && !Number.isNaN(Number(cell.label))}
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
          ))}
        </div>
      ))}
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
