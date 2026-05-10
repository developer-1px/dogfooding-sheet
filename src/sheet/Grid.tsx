import { useEffect, useRef } from 'react'
import { COL_LETTERS } from './schema'
import { idsForCol, idsForRow, idsForAll } from './range'
import { Cell } from './Cell'
import { useDragSelect } from './useDragSelect'
import { useColWidths } from './useColWidths'
import { ContextMenu } from './ContextMenu'
import { useCellMenu } from './useCellMenu'
import { useSheetGrid } from './useSheetGrid'
import type { useSheet } from './useSheet'

type SheetCtx = ReturnType<typeof useSheet>

export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, focusId, setSelectedIds, highlightedIds, sheet, writeCell, insertRow, deleteRow, sortByCol } = ctx
  const hiSet = new Set(highlightedIds)
  const cellMenu = useCellMenu({ sheet, setFocusId, writeCell, insertRow, deleteRow, sortByCol })
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
              onMouseEnter={() => drag.onMouseEnter(cell.id)}
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
