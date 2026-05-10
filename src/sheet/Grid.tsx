import { useEffect, useRef } from 'react'
import { type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'
import { COL_LETTERS, ROW_COUNT, parseCellId } from './schema'
import type { useSheet } from './useSheet'

type SheetCtx = ReturnType<typeof useSheet>

export function Grid({ ctx }: { ctx: SheetCtx }) {
  const { data, setFocusId, editing, draft, setDraft, startEdit, commitEdit, cancelEdit, focusId } = ctx
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      const len = inputRef.current.value.length
      inputRef.current.setSelectionRange(len, len)
    }
  }, [editing])

  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) { setFocusId(e.id); return }
    if (e.type === 'activate' && e.id && parseCellId(e.id)) startEdit(e.id)
  }

  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useGridPattern(
    data, onEvent,
    {
      label: 'Spreadsheet',
      rowCount: ROW_COUNT + 1,
      colCount: COL_LETTERS.length,
      editable: true,
      selectionMode: 'rect',
    },
  )

  const dataRows = rows.slice(COL_LETTERS.length)

  return (
    <div {...rootProps} className="grid">
      <div role="row" className="grid-row header-row">
        <span className="corner-cell" aria-hidden />
        {COL_LETTERS.map((c) => (
          <span key={c} {...columnHeaderProps(`h-${c}`)} className="header-cell">{c}</span>
        ))}
      </div>
      {dataRows.map((row, rIdx) => (
        <div key={row.id} {...rowProps(row.id)} className="grid-row">
          <span className="row-header" aria-hidden>{rIdx + 1}</span>
          {row.cells.map((cell) => {
            const isEditing = editing === cell.id
            return (
              <span
                key={cell.id}
                {...cellProps(cell.id)}
                className={`cell${cell.selected ? ' selected' : ''}${focusId === cell.id ? ' focused' : ''}`}
                onDoubleClick={() => startEdit(cell.id)}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    className="cell-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                      else if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                    }}
                  />
                ) : (
                  cell.label
                )}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}
