import type { InputProps, SelectProps } from '../../interactive-os/useEditable'
import { type WriteCell } from '../schema'
import { Cell } from './Cell'
import { RowHeader } from './RowHeader'
import { createGridCellViewModel, type MergeAnchor } from './gridCellViewModel'
import type { StyleLookup } from '../formatting/useStyles'
import type { NoteLookup } from '../useNotes'
import type { RuleLookup } from '../validation/useValidation'
import type { Rect } from '@spredsheet/grid'
import type { SheetGridItemProps, SheetGridRow } from './gridTypes'

interface Props {
  rIdx: number
  rowItemProps: SheetGridRow
  rowProps: SheetGridItemProps
  cellPropsFor: (id: string) => SheetGridItemProps
  gridTemplate: string
  rowCls: string
  freezeCols: number
  freezeLefts: number[]
  rowHeight: number
  freezeTop?: number
  mergeAnchors: Map<string, MergeAnchor>
  mergeHidden: Set<string>
  hiddenCols: Set<string>
  hiddenRows: Set<number>
  showRow: (row: number) => void
  selectedRows: Set<number>
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
  focusId: string | null
  fillSourceRect: Rect | null
  editing: string | null
  draft: string
  setDraft: (v: string) => void
  setSelectedIds: (ids: string[]) => void
  startEdit: (id: string, initial?: string, opts?: { caret?: 'end' | 'start' | 'select-all' }) => void
  commitEdit: (move?: { dRow: number; dCol: number }) => void
  cancelEdit: () => void
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
    <div
      {...p.rowProps}
      className={p.rowCls}
      style={{
        gridTemplateColumns: p.gridTemplate,
        minHeight: p.rowHeight,
        ...(p.freezeTop !== undefined ? { top: p.freezeTop } : {}),
      }}
    >
      <RowHeader
        rIdx={p.rIdx}
        focusId={p.focusId}
        setFocusId={p.setFocusId}
        setSelectAnchor={p.setSelectAnchor}
        setSelectedIds={p.setSelectedIds}
        heightOf={p.heightOf}
        onResize={p.onResize}
        onResizeEnd={p.onResizeEnd}
        resetRowHeight={p.resetRowHeight}
        onContextMenu={p.onRowHeaderContextMenu}
        colLetters={p.colLetters}
        hiddenRows={p.hiddenRows}
        showRow={p.showRow}
        selected={p.selectedRows.has(p.rIdx)}
        active={p.focusId?.startsWith(`r${p.rIdx}-`) ?? false}
      />
      {p.rowItemProps.cells.map((cell, cIdx) => {
        const view = createGridCellViewModel({
          rowIndex: p.rIdx,
          colIndex: cIdx,
          cell,
          colLetters: p.colLetters,
          hiddenCols: p.hiddenCols,
          mergeAnchors: p.mergeAnchors,
          mergeHidden: p.mergeHidden,
          freezeCols: p.freezeCols,
          freezeLefts: p.freezeLefts,
          focusId: p.focusId,
          fillSourceRect: p.fillSourceRect,
          styleOf: p.styleOf,
          noteOf: p.noteOf,
          rawOf: p.rawOf,
          ruleOf: p.ruleOf,
          condBgOf: p.condBgOf,
          highlightedIds: p.hiSet,
          previewIds: p.previewIds,
        })
        if (!view) return null
        return (
          <Cell
            key={cell.id}
            cellProps={p.cellPropsFor(cell.id)}
            address={view.address}
            label={view.label}
            selected={view.selected}
            focused={view.focused}
            highlighted={view.highlighted}
            isNum={view.numeric}
            mergeRange={view.mergeRange}
            mergeRows={view.mergeRows}
            mergeCols={view.mergeCols}
            styleClass={view.styleClass}
            styleInline={view.styleInline}
            note={view.note}
            tooltip={view.tooltip}
            validationOptions={view.validationOptions}
            isCheckbox={view.checkbox}
            onCheckboxToggle={() => p.writeCell(view.address, view.nextCheckboxValue)}
            editing={p.editing === view.id}
            draft={p.draft}
            setDraft={p.setDraft}
            onCommit={p.commitEdit}
            onCancel={p.cancelEdit}
            onStartEdit={() => p.startEdit(view.id, undefined, { caret: 'end' })}
            onMouseDown={(e) => p.onCellMouseDown(view.id, e)}
            onMouseEnter={(e) => p.onCellMouseEnter(view.id, e)}
            isFillCorner={view.fillCorner}
            onFillHandleMouseDown={p.onFillHandleMouseDown}
            previewing={view.previewing}
            onFormulaPickKeyDown={p.onFormulaPickKeyDown}
            ctxHandlers={p.getCellCtxHandlers(view.id)}
            inputProps={p.inputProps}
            selectProps={p.selectProps}
          />
        )
      })}
    </div>
  )
}
