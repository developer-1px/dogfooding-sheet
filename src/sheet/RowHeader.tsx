import { idsForRow } from '../lib/range'
import { parseCellId } from './schema'

const rowSelectIds = (rIdx: number, anchor: string | null): string[] => {
  const p = anchor ? parseCellId(anchor) : null; const from = p ? p.row : rIdx
  const ids: string[] = []
  for (let r = Math.min(from, rIdx); r <= Math.max(from, rIdx); r++) ids.push(...idsForRow(r))
  return ids
}

interface Props {
  rIdx: number
  focusId: string | null
  setSelectedIds: (ids: string[]) => void
  startResizeRow: (row: number) => (e: React.MouseEvent) => void
  resetRowHeight: (row: number) => void
  onContextMenu: (e: React.MouseEvent) => void
}

export function RowHeader({ rIdx, focusId, setSelectedIds, startResizeRow, resetRowHeight, onContextMenu }: Props) {
  return (
    <span
      className="row-header"
      onClick={(e) => setSelectedIds(rowSelectIds(rIdx, e.shiftKey ? focusId : null))}
      onContextMenu={onContextMenu}
      title="클릭=행 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 아래쪽 가장자리 드래그=높이 조정"
    >
      {rIdx + 1}
      <span className="row-resizer" onMouseDown={startResizeRow(rIdx)} onDoubleClick={(e) => { e.stopPropagation(); resetRowHeight(rIdx) }} title="드래그=높이 조정 / 더블클릭=기본값 복원" />
    </span>
  )
}
