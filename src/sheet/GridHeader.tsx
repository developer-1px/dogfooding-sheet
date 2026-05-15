import { useResizeGesture } from '@interactive-os/aria-kernel/gesture'
import { colIndex } from './schema'
import { idsForCol, idsForAll } from '../lib/range'
import type { ItemProps } from '@interactive-os/aria-kernel/patterns/types'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => ItemProps
  widthOf: (col: string) => number
  onResize: (col: string, w: number) => void
  onResizeEnd: (col: string, w: number) => void
  autoFitCol: (col: string) => void
  setSelectedIds: (ids: string[]) => void
  hiddenCols: Set<string>
  focusCol: string | null
  onHeaderContextMenu: (e: React.MouseEvent, col: string) => void
  rowCount: number
  colLetters: readonly string[]
}

const colRangeIds = (target: string, anchor: string | null, rowCount: number, colLetters: readonly string[]): string[] => {
  const a = anchor ? colIndex(anchor) : -1
  const t = colIndex(target)
  if (a < 0) return idsForCol(target, rowCount)
  const ids: string[] = []
  for (let i = Math.min(a, t); i <= Math.max(a, t); i++) ids.push(...idsForCol(colLetters[i], rowCount))
  return ids
}

function ColResizer({ col, widthOf, onResize, onResizeEnd, autoFitCol }: {
  col: string
  widthOf: (col: string) => number
  onResize: (col: string, w: number) => void
  onResizeEnd: (col: string, w: number) => void
  autoFitCol: (col: string) => void
}) {
  const { handleProps } = useResizeGesture({
    axis: 'x',
    initial: () => widthOf(col),
    onChange: (w) => onResize(col, w),
    onEnd: (w) => onResizeEnd(col, w),
    min: 40,
    max: 400,
  })
  return <span className="col-resizer" {...handleProps} onDoubleClick={(e) => { e.stopPropagation(); autoFitCol(col) }} title="드래그로 너비 조정 / 더블클릭 자동 맞춤" />
}

export function GridHeader({ gridTemplate, columnHeaderProps, widthOf, onResize, onResizeEnd, autoFitCol, setSelectedIds, hiddenCols, focusCol, onHeaderContextMenu, rowCount, colLetters }: Props) {
  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span className="corner-cell" onClick={() => setSelectedIds(idsForAll(rowCount, colLetters))} />
      {colLetters.map((c) => {
        if (hiddenCols.has(c)) return null
        return (
          <span
            key={c}
            {...columnHeaderProps(`h-${c}`)}
            className={`header-cell${c === focusCol ? ' active' : ''}`}
            onClick={(e) => setSelectedIds(colRangeIds(c, e.shiftKey ? focusCol : null, rowCount, colLetters))}
            onContextMenu={(e) => onHeaderContextMenu(e, c)}
            title="우클릭으로 열 메뉴"
          >
            {c}
            <ColResizer col={c} widthOf={widthOf} onResize={onResize} onResizeEnd={onResizeEnd} autoFitCol={autoFitCol} />
          </span>
        )
      })}
    </div>
  )
}
