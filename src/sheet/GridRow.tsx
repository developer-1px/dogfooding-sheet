import type { InputProps, SelectProps } from 'editable-lifecycle'
import { COL_LETTERS } from './schema'
import { Cell } from './Cell'
import { RowHeader } from './RowHeader'
import { isFillCorner } from './fillCorner'
import { styleToProps, type CellStyle } from './useStyles'
import type { GridCell } from '@p/aria-kernel/patterns'
import type { ItemProps } from '@p/aria-kernel/patterns/types'

interface Props {
  rIdx: number
  rowItemProps: { id: string; cells: GridCell[] }
  rowProps: ItemProps
  cellPropsFor: (id: string) => ItemProps
  gridTemplate: string
  rowCls: string
  freezeFirstCol: boolean; rowHeight: number
  hiddenCols: Set<string>
  focusId: string | null
  selectedIds: string[]
  editing: string | null
  draft: string
  setDraft: (v: string) => void
  setSelectedIds: (ids: string[]) => void
  startEdit: (id: string) => void
  commitEdit: (move?: { dRow: number; dCol: number }) => void
  cancelEdit: () => void
  hideRow: (row: number) => void
  startResizeRow: (row: number) => (e: React.MouseEvent) => void
  styleOf: (k: string) => CellStyle | undefined
  noteOf: (k: string) => string | undefined
  rawOf: (k: string) => string | undefined
  ruleOf: (k: string) => { type: 'list'; options: string[] } | { type: 'checkbox' } | undefined
  writeCell: (k: string, v: string) => void
  condBgOf: (col: string, displayed: string) => string | undefined
  hiSet: Set<string>
  previewIds: Set<string>
  onCellMouseDown: (id: string, e: React.MouseEvent) => void
  onCellMouseEnter: (id: string) => void
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  onCellContextMenu: (e: React.MouseEvent, id: string) => void
  inputProps: InputProps
  selectProps: SelectProps
}

export function GridRow(p: Props) {
  return (
    <div {...p.rowProps} className={p.rowCls} style={{ gridTemplateColumns: p.gridTemplate, minHeight: p.rowHeight }}>
      <RowHeader rIdx={p.rIdx} focusId={p.focusId} setSelectedIds={p.setSelectedIds} hideRow={p.hideRow} startResizeRow={p.startResizeRow} />
      {p.rowItemProps.cells.map((cell, cIdx) => {
        if (p.hiddenCols.has(COL_LETTERS[cIdx])) return null
        const m = /^r(\d+)-([A-J])$/.exec(cell.id)
        const k = m ? `${m[2]}${Number(m[1]) + 1}` : ''
        const extra = p.freezeFirstCol && cIdx === 0 ? ' freeze-col' : ''
        const sp = styleToProps(p.styleOf(k))
        const condBg = m ? p.condBgOf(m[2], cell.label) : undefined
        const styleInline = condBg ? { ...sp.style, background: condBg } : sp.style
        return (
          <Cell
            key={cell.id}
            cellProps={p.cellPropsFor(cell.id)}
            label={cell.label}
            selected={cell.selected}
            focused={p.focusId === cell.id}
            highlighted={p.hiSet.has(cell.id)}
            isNum={cell.label !== '' && (!Number.isNaN(Number(cell.label)) || !Number.isNaN(Number(p.rawOf(k) ?? '')))}
            styleClass={sp.className + extra}
            styleInline={styleInline}
            note={p.noteOf(k)}
            tooltip={p.rawOf(k)?.startsWith('=') ? p.rawOf(k) : undefined}
            validationOptions={p.ruleOf(k)?.type === 'list' ? (p.ruleOf(k) as { options: string[] }).options : undefined}
            isCheckbox={p.ruleOf(k)?.type === 'checkbox'} onCheckboxToggle={() => p.writeCell(k, p.rawOf(k) === 'TRUE' ? 'FALSE' : 'TRUE')}
            editing={p.editing === cell.id}
            draft={p.draft}
            setDraft={p.setDraft}
            onCommit={p.commitEdit} onCancel={p.cancelEdit}
            onStartEdit={() => p.startEdit(cell.id)}
            onMouseDown={(e) => p.onCellMouseDown(cell.id, e)} onMouseEnter={() => p.onCellMouseEnter(cell.id)}
            isFillCorner={isFillCorner(cell.id, p.focusId, p.selectedIds)}
            onFillHandleMouseDown={p.onFillHandleMouseDown}
            previewing={p.previewIds.has(cell.id)}
            onContextMenu={(e) => p.onCellContextMenu(e, cell.id)}
            inputProps={p.inputProps}
            selectProps={p.selectProps}
          />
        )
      })}
    </div>
  )
}
