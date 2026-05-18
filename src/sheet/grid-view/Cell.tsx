import type { ItemProps } from '@interactive-os/aria-kernel/patterns/types'
import type { InputProps, SelectProps } from '../../interactive-os/useEditable'
import { numericValue } from '@spredsheet/grid'

interface Props {
  cellProps: ItemProps
  address: string
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

export function Cell(p: Props) {
  const isError = /^#[A-Z/]+!?$/.test(p.label)
  const ariaLabel = [
    p.address,
    p.label === '' ? '빈 셀' : p.label,
    isError ? '오류' : '',
    p.selected ? '선택됨' : '',
    p.focused ? '현재 셀' : '',
  ].filter(Boolean).join(' ')
  const inputProps = {
    ...p.inputProps,
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      p.onFormulaPickKeyDown(e)
      if (!e.defaultPrevented) p.inputProps.onKeyDown?.(e)
    },
  }
  const textareaProps = {
    ...p.inputProps,
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      p.onFormulaPickKeyDown(e)
      if (!e.defaultPrevented) p.inputProps.onKeyDown?.(e)
    },
  } as React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }

  return (
    <span
      {...p.cellProps}
      aria-label={ariaLabel}
      aria-current={p.focused ? 'true' : undefined}
      aria-selected={p.selected}
      aria-invalid={isError || undefined}
      className={`cell${p.selected ? ' selected' : ''}${p.focused ? ' focused' : ''}${p.isNum ? ' numeric' : ''}${p.isNum && numericValue(p.label) < 0 ? ' negative' : ''}${isError ? ' errcell' : ''}${p.highlighted ? ' ref-hi' : ''}${p.previewing ? ' preview' : ''}${p.styleClass ? ' ' + p.styleClass : ''}`}
      style={p.styleInline}
      onDoubleClick={p.onStartEdit}
      onMouseDown={p.onMouseDown}
      onMouseEnter={p.onMouseEnter}
      onContextMenu={p.ctxHandlers.onContextMenu}
      onKeyDown={(e) => { p.ctxHandlers.onKeyDown(e); if (!e.defaultPrevented) p.cellProps.onKeyDown?.(e) }}
      title={p.note ?? p.tooltip ?? (p.label.length > 20 ? p.label : undefined)}
    >
      {p.isCheckbox ? (
        <input
          type="checkbox"
          className="cell-checkbox"
          aria-label={ariaLabel}
          checked={p.label === 'TRUE'}
          onChange={p.onCheckboxToggle}
          onClick={(e) => e.stopPropagation()}
        />
      ) : p.editing ? (
        p.validationOptions ? (
          <select className="cell-input" {...p.selectProps}>
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
          {/^https?:\/\/.+\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i.test(p.label)
            ? <img className="cell-img" src={p.label} alt="" onClick={(e) => e.stopPropagation()} />
            : /^https?:\/\//.test(p.label)
              ? <a className="cell-link" href={p.label} target="_blank" rel="noreferrer noopener" onClick={(e) => e.stopPropagation()}>{p.label}</a>
              : /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(p.label)
                ? <a className="cell-link" href={`mailto:${p.label}`} onClick={(e) => e.stopPropagation()}>{p.label}</a>
                : p.label}
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
