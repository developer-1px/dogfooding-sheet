import { useResizeGesture } from '@interactive-os/aria-kernel/gesture'
import { idsForRow } from '@spredsheet/grid'
import { parseCellId } from '../schema'

const rowSelectIds = (rIdx: number, anchor: string | null, colLetters: readonly string[]): string[] => {
  const p = anchor ? parseCellId(anchor) : null; const from = p ? p.row : rIdx
  const ids: string[] = []
  for (let r = Math.min(from, rIdx); r <= Math.max(from, rIdx); r++) ids.push(...idsForRow(r, colLetters))
  return ids
}

interface Props {
  rIdx: number
  focusId: string | null
  setSelectedIds: (ids: string[]) => void
  heightOf: (row: number) => number
  onResize: (row: number, h: number) => void
  onResizeEnd: (row: number, h: number) => void
  resetRowHeight: (row: number) => void
  onContextMenu: (e: React.MouseEvent) => void
  colLetters: readonly string[]
  hiddenRows: Set<number>
  showRow: (row: number) => void
  selected: boolean
}

function RowResizer({ rIdx, heightOf, onResize, onResizeEnd, resetRowHeight }: Pick<Props, 'rIdx' | 'heightOf' | 'onResize' | 'onResizeEnd' | 'resetRowHeight'>) {
  const { handleProps } = useResizeGesture({
    axis: 'y',
    initial: () => heightOf(rIdx),
    onChange: (h) => onResize(rIdx, h),
    onEnd: (h) => onResizeEnd(rIdx, h),
    min: 18,
  })
  return <span className="row-resizer" {...handleProps} onDoubleClick={(e) => { e.stopPropagation(); resetRowHeight(rIdx) }} title="드래그=높이 조정 / 더블클릭=기본값 복원" />
}

export function RowHeader({ rIdx, focusId, setSelectedIds, heightOf, onResize, onResizeEnd, resetRowHeight, onContextMenu, colLetters, hiddenRows, showRow, selected }: Props) {
  return (
    <span
      className={`row-header${selected ? ' selected-header' : ''}`}
      onClick={(e) => setSelectedIds(rowSelectIds(rIdx, e.shiftKey ? focusId : null, colLetters))}
      onContextMenu={onContextMenu}
      title="클릭=행 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 아래쪽 가장자리 드래그=높이 조정"
    >
      {hiddenRows.has(rIdx - 1) && <button className="unhide-row top" onClick={(e) => { e.stopPropagation(); showRow(rIdx - 1) }} title={`${rIdx}행 숨김 표시`} aria-label={`${rIdx}행 숨김 표시`}>⌃</button>}
      {rIdx + 1}
      {hiddenRows.has(rIdx + 1) && <button className="unhide-row bottom" onClick={(e) => { e.stopPropagation(); showRow(rIdx + 1) }} title={`${rIdx + 2}행 숨김 표시`} aria-label={`${rIdx + 2}행 숨김 표시`}>⌄</button>}
      <RowResizer rIdx={rIdx} heightOf={heightOf} onResize={onResize} onResizeEnd={onResizeEnd} resetRowHeight={resetRowHeight} />
    </span>
  )
}
