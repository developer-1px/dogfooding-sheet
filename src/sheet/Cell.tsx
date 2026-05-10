import type { ItemProps } from '@p/aria-kernel/patterns/types'
import type { InputProps, SelectProps } from 'editable-lifecycle'

interface Props {
  cellProps: ItemProps
  label: string
  selected: boolean
  focused: boolean
  highlighted: boolean
  isNum: boolean
  editing: boolean
  draft: string
  setDraft: (v: string) => void
  onCommit: (move?: { dRow: number; dCol: number }) => void
  onCancel: () => void
  onStartEdit: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onContextMenu: (e: React.MouseEvent) => void
  isFillCorner: boolean
  previewing: boolean
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  styleClass: string
  styleInline: React.CSSProperties
  note?: string
  validationOptions?: string[]
  inputProps: InputProps
  selectProps: SelectProps
}

export function Cell(p: Props) {
  return (
    <span
      {...p.cellProps}
      className={`cell${p.selected ? ' selected' : ''}${p.focused ? ' focused' : ''}${p.isNum ? ' numeric' : ''}${/^#[A-Z/]+!?$/.test(p.label) ? ' errcell' : ''}${p.highlighted ? ' ref-hi' : ''}${p.previewing ? ' preview' : ''}${p.styleClass ? ' ' + p.styleClass : ''}`}
      style={p.styleInline}
      onDoubleClick={p.onStartEdit}
      onMouseDown={p.onMouseDown}
      onMouseEnter={p.onMouseEnter}
      onContextMenu={p.onContextMenu}
      title={p.note}
    >
      {p.editing ? (
        p.validationOptions ? (
          <select className="cell-input" {...p.selectProps}>
            <option value="">—</option>
            {p.validationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="cell-input" {...p.inputProps} />
        )
      ) : (
        <>
          {p.label}
          {p.note && <span className="note-mark" aria-hidden />}
          {p.validationOptions && !p.editing && <span className="dropdown-mark" aria-hidden>▾</span>}
          {p.isFillCorner && !p.editing && (
            <span className="fill-handle" onMouseDown={p.onFillHandleMouseDown} />
          )}
        </>
      )}
    </span>
  )
}
