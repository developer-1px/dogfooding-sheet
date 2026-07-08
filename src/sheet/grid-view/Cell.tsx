import { createCellDisplayModel, type CellContent } from '@spredsheet/editable-grid/cell-display'
import type { InputProps, SelectProps } from '../../interactive-os/useEditable'
import type { FormulaReferenceCellDecoration, FormulaReferenceTextDecoration } from '../selection/formulaReferenceDecorations'
import { ContenteditableCellEditor } from './ContenteditableCellEditor'
import type { SheetGridItemProps } from './gridTypes'

interface CommitOptions {
  readonly restoreFocus?: boolean
}

interface Props {
  cellProps: SheetGridItemProps
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
  onCommit: (draft: string, opts?: CommitOptions) => void
  onCancel: (opts?: CommitOptions) => void
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
  formulaReference?: FormulaReferenceCellDecoration
  formulaReferenceText: readonly FormulaReferenceTextDecoration[]
  note?: string
  tooltip?: string
  validationOptions?: string[]
  isCheckbox?: boolean
  onCheckboxToggle?: () => void
  inputProps: InputProps
  selectProps: SelectProps
}

function CellContentView({ address, content }: { address: string; content: CellContent }) {
  if (content.kind === 'image') {
    return <img className="cell-img" src={content.src} alt={`${address} 이미지: ${content.src}`} title={content.src} loading="lazy" decoding="async" onClick={(e) => e.stopPropagation()} />
  }
  if (content.kind === 'link') {
    return <a className="cell-link" href={content.href} target="_blank" rel="noreferrer noopener" title={content.label} aria-label={`${address} 링크 열기: ${content.label}`} aria-keyshortcuts="Enter" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{content.label}</a>
  }
  if (content.kind === 'email') {
    return <a className="cell-link" href={content.href} title={content.label} aria-label={`${address} 이메일 작성: ${content.label}`} aria-keyshortcuts="Enter" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>{content.label}</a>
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
    validationList: !!p.validationOptions,
    checkbox: !!p.isCheckbox,
    formula: p.tooltip?.startsWith('='),
  })
  const editTitle = `${display.editLabel} (Enter=저장 / Esc=취소)`
  const editKeyShortcuts = 'Enter Escape'
  const textareaProps = {
    ...p.inputProps,
    'aria-label': display.editLabel,
    'aria-keyshortcuts': editKeyShortcuts,
    title: editTitle,
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      p.onFormulaPickKeyDown(e)
      if (!e.defaultPrevented) p.inputProps.onKeyDown?.(e)
      e.stopPropagation()
    },
  } as React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }
  const selectProps = {
    ...p.selectProps,
    'aria-label': display.editLabel,
    'aria-keyshortcuts': editKeyShortcuts,
    title: editTitle,
    onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => {
      p.selectProps.onKeyDown?.(e)
      e.stopPropagation()
    },
  } as React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }
  const markerClassName = [
    p.note && !p.editing ? 'has-note-marker' : '',
    p.validationOptions && !p.editing ? 'has-dropdown-marker' : '',
  ].filter(Boolean).join(' ')
  const className = p.formulaReference
    ? `${display.className} ${p.formulaReference.className}`
    : display.className
  const cellClassName = markerClassName ? `${className} ${markerClassName}` : className

  return (
    <span
      {...p.cellProps}
      aria-label={display.ariaLabel}
      aria-current={p.focused ? 'true' : undefined}
      aria-selected={p.selected}
      aria-invalid={display.error || undefined}
      aria-colspan={p.mergeCols && p.mergeCols > 1 ? p.mergeCols : undefined}
      aria-rowspan={p.mergeRows && p.mergeRows > 1 ? p.mergeRows : undefined}
      aria-keyshortcuts={p.editing ? undefined : 'Enter'}
      aria-haspopup={p.validationOptions && !p.editing ? 'listbox' : undefined}
      aria-expanded={p.validationOptions && !p.editing ? false : undefined}
      className={cellClassName}
      style={p.styleInline}
      data-formula-ref-index={p.formulaReference?.index}
      data-formula-ref={p.formulaReference?.token}
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
          aria-keyshortcuts="Space"
          title={display.ariaLabel}
          checked={p.label === 'TRUE'}
          onChange={p.onCheckboxToggle}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      ) : p.editing ? (
        p.validationOptions ? (
          <select className="cell-input" {...selectProps}>
            <option value="">—</option>
            {p.validationOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          p.styleClass.split(' ').includes('wrap')
            ? <textarea className="cell-input wrap-input" {...textareaProps} />
            : (
              <ContenteditableCellEditor
                ariaLabel={display.editLabel}
                ariaKeyShortcuts={editKeyShortcuts}
                title={editTitle}
                draft={p.draft}
                setDraft={p.setDraft}
                textDecorations={p.formulaReferenceText}
                onCommit={p.onCommit}
                onCancel={p.onCancel}
                onKeyDown={p.onFormulaPickKeyDown}
              />
            )
        )
      ) : (
        <>
          <CellContentView address={p.address} content={display.content} />
          {p.note && <span className="note-mark" aria-hidden />}
          {p.validationOptions && !p.editing && <span className="dropdown-mark" aria-hidden>▾</span>}
          {p.isFillCorner && !p.editing && (
            <span className="fill-handle" onMouseDown={p.onFillHandleMouseDown} aria-hidden />
          )}
        </>
      )}
    </span>
  )
}
