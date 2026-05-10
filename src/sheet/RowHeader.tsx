import { idsForRow } from '../lib/range'

const rowSelectIds = (rIdx: number, anchor: string | null): string[] => {
  const m = anchor && /^r(\d+)/.exec(anchor); const from = m ? Number(m[1]) : rIdx
  const ids: string[] = []
  for (let r = Math.min(from, rIdx); r <= Math.max(from, rIdx); r++) ids.push(...idsForRow(r))
  return ids
}

interface Props {
  rIdx: number
  focusId: string | null
  setSelectedIds: (ids: string[]) => void
  hideRow: (row: number) => void
  startResizeRow: (row: number) => (e: React.MouseEvent) => void
}

export function RowHeader({ rIdx, focusId, setSelectedIds, hideRow, startResizeRow }: Props) {
  return (
    <span
      className="row-header"
      onClick={(e) => setSelectedIds(rowSelectIds(rIdx, e.shiftKey ? focusId : null))}
      onContextMenu={(e) => { e.preventDefault(); hideRow(rIdx) }}
      title="클릭=행 선택 / Shift+클릭=범위 / 우클릭=행 숨기기 / 아래쪽 가장자리 드래그=높이 조정"
    >
      {rIdx + 1}
      <span className="row-resizer" onMouseDown={startResizeRow(rIdx)} title="드래그로 행 높이 조정" />
    </span>
  )
}
