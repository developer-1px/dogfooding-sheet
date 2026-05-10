import type { InputProps } from 'editable-lifecycle'
import { COL_LETTERS } from './schema'
import { idsForRow } from '../lib/range'
import { Cell } from './Cell'
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
  freezeFirstCol: boolean
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
  styleOf: (k: string) => CellStyle | undefined
  noteOf: (k: string) => string | undefined
  ruleOf: (k: string) => { type: 'list'; options: string[] } | undefined
  condBgOf: (col: string, displayed: string) => string | undefined
  hiSet: Set<string>
  previewIds: Set<string>
  onCellMouseDown: (id: string, e: React.MouseEvent) => void
  onCellMouseEnter: (id: string) => void
  onFillHandleMouseDown: (e: React.MouseEvent) => void
  onCellContextMenu: (e: React.MouseEvent, id: string) => void
  inputProps: InputProps
}

export function GridRow(p: Props) {
  return (
    <div {...p.rowProps} className={p.rowCls} style={{ gridTemplateColumns: p.gridTemplate }}>
      <span
        className="row-header"
        onClick={() => p.setSelectedIds(idsForRow(p.rIdx))}
        onContextMenu={(e) => { e.preventDefault(); p.hideRow(p.rIdx) }}
        title="우클릭으로 행 숨기기"
      >{p.rIdx + 1}</span>
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
            isNum={cell.label !== '' && !Number.isNaN(Number(cell.label))}
            styleClass={sp.className + extra}
            styleInline={styleInline}
            note={p.noteOf(k)}
            validationOptions={p.ruleOf(k)?.options}
            editing={p.editing === cell.id}
            draft={p.draft}
            setDraft={p.setDraft}
            onCommit={p.commitEdit}
            onCancel={p.cancelEdit}
            onStartEdit={() => p.startEdit(cell.id)}
            onMouseDown={(e) => p.onCellMouseDown(cell.id, e)}
            onMouseEnter={() => p.onCellMouseEnter(cell.id)}
            isFillCorner={isFillCorner(cell.id, p.focusId, p.selectedIds)}
            onFillHandleMouseDown={p.onFillHandleMouseDown}
            previewing={p.previewIds.has(cell.id)}
            onContextMenu={(e) => p.onCellContextMenu(e, cell.id)}
            inputProps={p.inputProps}
          />
        )
      })}
    </div>
  )
}
