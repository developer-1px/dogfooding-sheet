import { useEffect, useRef, useState } from 'react'
import * as z from 'zod'
import { useJson } from 'zod-crud'
import { fromTree, type NormalizedData, type UiEvent } from '@p/aria-kernel'
import { useGridPattern } from '@p/aria-kernel/patterns'
import './App.css'

const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
const ROW_COUNT = 20

const SheetSchema = z.object({
  cells: z.record(z.string(), z.string()),
})
type Sheet = z.infer<typeof SheetSchema>

const initialSheet: Sheet = {
  cells: {
    A1: 'Item', B1: 'Qty', C1: 'Price', D1: 'Total',
    A2: 'Apple', B2: '3', C2: '1.50', D2: '4.50',
    A3: 'Bread', B3: '2', C3: '2.25', D3: '4.50',
    A4: 'Milk', B4: '1', C4: '3.00', D4: '3.00',
  },
}

const cellKey = (col: string, row: number) => `${col}${row + 1}`

interface Node { id: string; label: string; children?: Node[] }

function buildData(getCell: (k: string) => string): NormalizedData {
  const tree: Node[] = [
    ...COL_LETTERS.map((c): Node => ({ id: `h-${c}`, label: c })),
    ...Array.from({ length: ROW_COUNT }, (_, r): Node => ({
      id: `r${r}`,
      label: String(r + 1),
      children: COL_LETTERS.map((c) => ({
        id: `r${r}-${c}`,
        label: getCell(cellKey(c, r)),
      })),
    })),
  ]
  return fromTree(tree)
}

const parseCellId = (id: string): { col: string; row: number } | null => {
  const m = /^r(\d+)-([A-J])$/.exec(id)
  return m ? { row: Number(m[1]), col: m[2] } : null
}

export default function App() {
  const [sheet, ops] = useJson(SheetSchema, initialSheet, { history: 100 })
  const [focusId, setFocusId] = useState<string | null>('r0-A')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const data = buildData((k) => sheet.cells[k] ?? '')
  data.meta = { ...data.meta, focus: focusId }

  const writeCell = (k: string, v: string) => {
    if (v === '') {
      if (sheet.cells[k] !== undefined) ops.remove(`/cells/${k}` as never)
    } else if (sheet.cells[k] === undefined) {
      ops.add(`/cells/${k}` as never, v as never)
    } else if (sheet.cells[k] !== v) {
      ops.replace(`/cells/${k}` as never, v as never)
    }
  }

  const commitEdit = () => {
    if (!editing) return
    const parsed = parseCellId(editing)
    if (parsed) writeCell(cellKey(parsed.col, parsed.row), draft)
    setEditing(null)
  }

  const startEdit = (id: string) => {
    const parsed = parseCellId(id)
    if (!parsed) return
    setEditing(id)
    setDraft(sheet.cells[cellKey(parsed.col, parsed.row)] ?? '')
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) ops.redo()
        else ops.undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, ops])

  const onEvent = (e: UiEvent) => {
    if (e.type === 'navigate' && e.id) {
      setFocusId(e.id)
      return
    }
    if (e.type === 'activate' && e.id && parseCellId(e.id)) {
      startEdit(e.id)
    }
  }

  const { rootProps, rowProps, columnHeaderProps, cellProps, rows } = useGridPattern(
    data,
    onEvent,
    {
      label: 'Spreadsheet',
      rowCount: ROW_COUNT + 1,
      colCount: COL_LETTERS.length,
      editable: true,
      selectionMode: 'rect',
    },
  )

  const focusCell = focusId ? parseCellId(focusId) : null
  const focusKey = focusCell ? cellKey(focusCell.col, focusCell.row) : null
  const dataRows = rows.slice(COL_LETTERS.length)

  return (
    <div className="sheet-app">
      <header className="sheet-toolbar">
        <strong>Sheet</strong>
        <span className="addr">{focusKey ?? '—'}</span>
        <input
          className="formula"
          value={focusKey ? sheet.cells[focusKey] ?? '' : ''}
          onChange={(e) => focusKey && writeCell(focusKey, e.target.value)}
          placeholder="Enter value…"
        />
        <button onClick={() => ops.undo()} disabled={!ops.canUndo()}>Undo</button>
        <button onClick={() => ops.redo()} disabled={!ops.canRedo()}>Redo</button>
      </header>

      <div {...rootProps} className="grid">
        <div role="row" className="grid-row header-row">
          <span className="corner-cell" aria-hidden />
          {COL_LETTERS.map((c) => (
            <span key={c} {...columnHeaderProps(`h-${c}`)} className="header-cell">
              {c}
            </span>
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
                        else if (e.key === 'Escape') { e.preventDefault(); setEditing(null) }
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
    </div>
  )
}
