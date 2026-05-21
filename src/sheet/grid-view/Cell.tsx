import type { ItemProps } from '@interactive-os/aria-kernel/patterns/types'
import { createCellDisplayModel, type CellContent } from '@spredsheet/editable-grid/cell-display'
import type { InputProps, SelectProps } from '../../interactive-os/useEditable'

interface Props {
  cellProps: ItemProps
  address: string
  label: string
  selected: boolean
  focused: boolean
  highlighted: boolean
  isNum: boolean
  mergeRange?: string
  mergeRows?: number
  mergeCols?: number
  editing: boolean
  draft: string
  setDraft: (v: string) => void
  onCommit: (move?: { dRow: number; dCol: number }) => void
  onCancel: () => void
  onStartEdit: () => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: (e: React.MouseEvent) => void
  ctxHandlers: { onContextMenu: (e: React.MouseEvent) => void; onKeyDown: (e: React.KeyboardEvent) => void }
  isFillCorner: boolean
  previewing: boolean
  onFormulaPickKeyDown: (e: React.KeyboardEvent) => void
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  styleClass: string
  styleInline: React.CSSProperties
  note?: string
  tooltip?: string
  validationOptions?: string[]
  isCheckbox?: boolean
  onCheckboxToggle?: () => void
  inputProps: InputProps
  selectProps: SelectProps
}

function CellContentView({ content }: { content: CellContent }) {
  if (content.kind === 'image') {
    return <img className="cell-img" src={content.src} alt="" onClick={(e) => e.stopPropagation()} />
  }
  if (content.kind === 'link') {
    return <a className="cell-link" href={content.href} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}>{content.label}</a>
  }
  if (content.kind === 'email') {
    return <a className="cell-link" href={content.href} onClick={(e) => e.stopPropagation()}>{content.label}</a>
  }
  return content.text
}

export function Cell(p: Props) {
  const display = createCellDisplayModel({
    address: p.address,
    label: p.label,
    selected: p.selected,
    focused: p.focused,
    editing: p.editing,
    mergeRange: p.mergeRange,
    numeric: p.isNum,
    highlighted: p.highlighted,
    previewing: p.previewing,
    styleClass: p.styleClass,
    note: p.note,
    tooltip: p.tooltip,
  })
  const inputProps = {
    ...p.inputProps,
    'aria-label': display.editLabel,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      p.onFormulaPickKeyDown(e)
      if (!e.defaultPrevented) p.inputProps.onKeyDown?.(e)
    },
  }
  const textareaProps = {
    ...p.inputProps,
    'aria-label': display.editLabel,
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      p.onFormulaPickKeyDown(e)
      if (!e.defaultPrevented) p.inputProps.onKeyDown?.(e)
    },
  } as React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }

  return (
    <span
      {...p.cellProps}
      aria-label={display.ariaLabel}
      aria-current={p.focused ? 'true' : undefined}
      aria-selected={p.selected}
      aria-invalid={display.error || undefined}
      aria-colspan={p.mergeCols && p.mergeCols > 1 ? p.mergeCols : undefined}
      aria-rowspan={p.mergeRows && p.mergeRows > 1 ? p.mergeRows : undefined}
      className={display.className}
      style={p.styleInline}
      onDoubleClick={p.onStartEdit}
      onMouseDown={p.onMouseDown}
      onMouseEnter={p.onMouseEnter}
      onContextMenu={p.ctxHandlers.onContextMenu}
      onKeyDown={(e) => { p.ctxHandlers.onKeyDown(e); if (!e.defaultPrevented) p.cellProps.onKeyDown?.(e) }}
      title={display.title}
    >
      {p.isCheckbox ? (
        <input
          type="checkbox"
          className="cell-checkbox"
          aria-label={display.ariaLabel}
          checked={p.label === 'TRUE'}
          onChange={p.onCheckboxToggle}
          onClick={(e) => e.stopPropagation()}
        />
      ) : p.editing ? (
        p.validationOptions ? (
          <select className="cell-input" aria-label={display.editLabel} {...p.selectProps}>
            <option value="">—</option>
            {p.validationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          p.styleClass.split(' ').includes('wrap')
            ? <textarea className="cell-input wrap-input" {...textareaProps} />
            : <input className="cell-input" {...inputProps} />
        )
      ) : (
        <>
          <CellContentView content={display.content} />
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
