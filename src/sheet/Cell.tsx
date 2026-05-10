import { forwardRef } from 'react'
import type { ItemProps } from '@p/aria-kernel/patterns/types'

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
}

export const Cell = forwardRef<HTMLInputElement, Props>(function Cell(p, ref) {
  return (
    <span
      {...p.cellProps}
      className={`cell${p.selected ? ' selected' : ''}${p.focused ? ' focused' : ''}${p.isNum ? ' numeric' : ''}${p.highlighted ? ' ref-hi' : ''}${p.previewing ? ' preview' : ''}${p.styleClass ? ' ' + p.styleClass : ''}`}
      style={p.styleInline}
      onDoubleClick={p.onStartEdit}
      onMouseDown={p.onMouseDown}
      onMouseEnter={p.onMouseEnter}
      onContextMenu={p.onContextMenu}
      title={p.note}
    >
      {p.editing ? (
        <input
          ref={ref}
          className="cell-input"
          value={p.draft}
          onChange={(e) => p.setDraft(e.target.value)}
          onBlur={() => p.onCommit()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              p.onCommit({ dRow: e.shiftKey ? -1 : 1, dCol: 0 })
            } else if (e.key === 'Tab') {
              e.preventDefault()
              p.onCommit({ dRow: 0, dCol: e.shiftKey ? -1 : 1 })
            } else if (e.key === 'Escape') {
              e.preventDefault()
              p.onCancel()
            }
          }}
        />
      ) : (
        <>
          {p.label}
          {p.note && <span className="note-mark" aria-hidden />}
          {p.isFillCorner && !p.editing && (
            <span className="fill-handle" onMouseDown={p.onFillHandleMouseDown} />
          )}
        </>
      )}
    </span>
  )
})
