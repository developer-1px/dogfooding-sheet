import type { InputProps, SelectProps } from '../../interactive-os/useEditable'
import { parseCellId, cellKey, type WriteCell } from '../schema'
import { Cell } from './Cell'
import { isNumeric } from '@spredsheet/grid'
import { RowHeader } from './RowHeader'
import { isFillCorner } from '../fill/fillCorner'
import { styleToProps, type StyleLookup } from '../formatting/useStyles'
import type { NoteLookup } from '../useNotes'
import type { RuleLookup } from '../validation/useValidation'
import type { GridCell } from '@interactive-os/aria-kernel/patterns'
import type { ItemProps } from '@interactive-os/aria-kernel/patterns/types'

const mergeRangeLabel = (rIdx: number, cIdx: number, anchor: { rows: number; cols: number }, colLetters: readonly string[]): string => {
  const start = cellKey(colLetters[cIdx], rIdx)
  const end = cellKey(colLetters[cIdx + anchor.cols - 1] ?? colLetters[cIdx], rIdx + anchor.rows - 1)
  return start === end ? start : `${start}:${end}`
}

interface Props {
  rIdx: number
  rowItemProps: { id: string; cells: GridCell[] }
  rowProps: ItemProps
  cellPropsFor: (id: string) => ItemProps
  gridTemplate: string
  rowCls: string
  freezeCols: number; freezeLefts: number[]; rowHeight: number; freezeTop?: number
  mergeAnchors: Map<string, { rows: number; cols: number }>
  mergeHidden: Set<string>
  hiddenCols: Set<string>
  hiddenRows: Set<number>
  showRow: (row: number) => void
  selectedRows: Set<number>
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
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
  onRowHeaderContextMenu: (e: React.MouseEvent) => void
  heightOf: (row: number) => number
  onResize: (row: number, h: number) => void
  onResizeEnd: (row: number, h: number) => void
  resetRowHeight: (row: number) => void
  styleOf: StyleLookup
  noteOf: NoteLookup
  rawOf: NoteLookup
  ruleOf: RuleLookup
  writeCell: WriteCell
  condBgOf: (col: string, displayed: string) => string | undefined
  hiSet: Set<string>
  previewIds: Set<string>
  onFormulaPickKeyDown: (e: React.KeyboardEvent) => void
  onCellMouseDown: (id: string, e: React.MouseEvent) => void
  onCellMouseEnter: (id: string, e: React.MouseEvent) => void
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  getCellCtxHandlers: (id: string) => { onContextMenu: (e: React.MouseEvent) => void; onKeyDown: (e: React.KeyboardEvent) => void }
  inputProps: InputProps
  selectProps: SelectProps
  colLetters: readonly string[]
}

export function GridRow(p: Props) {
  return (
    <div {...p.rowProps} className={p.rowCls} style={{ gridTemplateColumns: p.gridTemplate, minHeight: p.rowHeight, ...(p.freezeTop !== undefined ? { top: p.freezeTop } : {}) }}>
      <RowHeader rIdx={p.rIdx} focusId={p.focusId} setFocusId={p.setFocusId} setSelectAnchor={p.setSelectAnchor} setSelectedIds={p.setSelectedIds} heightOf={p.heightOf} onResize={p.onResize} onResizeEnd={p.onResizeEnd} resetRowHeight={p.resetRowHeight} onContextMenu={p.onRowHeaderContextMenu} colLetters={p.colLetters} hiddenRows={p.hiddenRows} showRow={p.showRow} selected={p.selectedRows.has(p.rIdx)} active={p.focusId?.startsWith(`r${p.rIdx}-`) ?? false} />
      {p.rowItemProps.cells.map((cell, cIdx) => {
        if (p.hiddenCols.has(p.colLetters[cIdx])) return null
        const mergeKey = `${p.rIdx},${cIdx}`
        if (p.mergeHidden.has(mergeKey)) return null
        const anchor = p.mergeAnchors.get(mergeKey)
        const pc = parseCellId(cell.id)
        const k = pc ? cellKey(pc.col, pc.row) : ''
        const extra = cIdx < p.freezeCols ? ' freeze-col' : ''
        const sp = styleToProps(p.styleOf(k))
        const condBg = pc ? p.condBgOf(pc.col, cell.label) : undefined
        const baseStyle = condBg ? { ...sp.style, background: condBg } : sp.style
        const mergeStyle = anchor ? { gridColumn: `${cIdx + 2} / span ${anchor.cols}`, zIndex: 4 } : {}
        const styleInline = { ...(cIdx < p.freezeCols ? { ...baseStyle, left: p.freezeLefts[cIdx] } : baseStyle), ...mergeStyle }
        return (
          <Cell
            key={cell.id}
            cellProps={p.cellPropsFor(cell.id)}
            address={k}
            label={cell.label}
            selected={cell.selected}
            focused={p.focusId === cell.id}
            highlighted={p.hiSet.has(cell.id)}
            isNum={cell.label !== '' && (isNumeric(cell.label) || isNumeric(p.rawOf(k) ?? ''))}
            mergeRange={anchor ? mergeRangeLabel(p.rIdx, cIdx, anchor, p.colLetters) : undefined}
            mergeRows={anchor?.rows}
            mergeCols={anchor?.cols}
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
            onMouseDown={(e) => p.onCellMouseDown(cell.id, e)} onMouseEnter={(e) => p.onCellMouseEnter(cell.id, e)}
            isFillCorner={isFillCorner(cell.id, p.focusId, p.selectedIds)}
            onFillHandleMouseDown={p.onFillHandleMouseDown}
            previewing={p.previewIds.has(cell.id)}
            onFormulaPickKeyDown={p.onFormulaPickKeyDown}
            ctxHandlers={p.getCellCtxHandlers(cell.id)}
            inputProps={p.inputProps}
            selectProps={p.selectProps}
          />
        )
      })}
    </div>
  )
}
