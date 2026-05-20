import { useResizeGesture } from '@interactive-os/aria-kernel/gesture'
import { colIndex } from '../schema'
import { selectAllHeaders, selectColumnHeader } from './headerSelection'
import { COLUMN_WIDTH_BOUNDS, resizeValueForKey } from './resizeRules'
import type { ItemProps } from '@interactive-os/aria-kernel/patterns/types'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => ItemProps
  widthOf: (col: string) => number
  onResize: (col: string, w: number) => void
  onResizeEnd: (col: string, w: number) => void
  autoFitCol: (col: string) => void
  setSelectedIds: (ids: string[]) => void
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
  hiddenCols: Set<string>
  showCol: (col: string) => void
  filterCol: string | null
  focusCol: string | null
  selectedCols: Set<string>
  allSelected: boolean
  onHeaderContextMenu: (e: React.MouseEvent, col: string) => void
  rowCount: number
  colLetters: readonly string[]
}

function ColResizer({ col, widthOf, onResize, onResizeEnd, autoFitCol }: {
  col: string
  widthOf: (col: string) => number
  onResize: (col: string, w: number) => void
  onResizeEnd: (col: string, w: number) => void
  autoFitCol: (col: string) => void
}) {
  const width = widthOf(col)
  const { handleProps } = useResizeGesture({
    axis: 'x',
    initial: () => widthOf(col),
    onChange: (w) => onResize(col, w),
    onEnd: (w) => onResizeEnd(col, w),
    min: COLUMN_WIDTH_BOUNDS.min,
    max: COLUMN_WIDTH_BOUNDS.max,
  })
  return (
    <span
      className="col-resizer col-resize"
      {...handleProps}
      role="separator"
      tabIndex={0}
      aria-label={`${col}열 너비 조정`}
      aria-orientation="vertical"
      aria-valuemin={COLUMN_WIDTH_BOUNDS.min}
      aria-valuemax={COLUMN_WIDTH_BOUNDS.max}
      aria-valuenow={Math.round(width)}
      onKeyDown={(e) => {
        const next = resizeValueForKey(widthOf(col), e.key, e.shiftKey, 'x', COLUMN_WIDTH_BOUNDS)
        if (next === null) return
        e.preventDefault()
        onResizeEnd(col, next)
      }}
      onDoubleClick={(e) => { e.stopPropagation(); autoFitCol(col) }}
      title="드래그로 너비 조정 / ← → 키로 조정 / 더블클릭 자동 맞춤"
    />
  )
}

export function GridHeader({ gridTemplate, columnHeaderProps, widthOf, onResize, onResizeEnd, autoFitCol, setSelectedIds, setFocusId, setSelectAnchor, hiddenCols, showCol, filterCol, focusCol, selectedCols, allSelected, onHeaderContextMenu, rowCount, colLetters }: Props) {
  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span
        className={`corner-cell${allSelected ? ' selected-header' : ''}`}
        role="columnheader"
        aria-label="전체 시트 선택"
        aria-selected={allSelected}
        title="전체 시트 선택"
        onClick={() => {
          const selection = selectAllHeaders(rowCount, colLetters)
          setSelectedIds(selection.selectedIds)
          setFocusId(selection.focusId)
          setSelectAnchor(selection.anchorId)
        }}
      />
      {colLetters.map((c) => {
        if (hiddenCols.has(c)) return null
        const prev = colLetters[colIndex(c) - 1]
        const next = colLetters[colIndex(c) + 1]
        return (
          <span
            key={c}
            {...columnHeaderProps(`h-${c}`)}
            className={`header-cell${c === focusCol ? ' active' : ''}${selectedCols.has(c) ? ' selected-header' : ''}${c === filterCol ? ' filtered' : ''}`}
            aria-label={`${c}열`}
            aria-current={c === focusCol ? 'true' : undefined}
            aria-selected={selectedCols.has(c)}
            onClick={(e) => {
              const selection = selectColumnHeader(c, e.shiftKey ? focusCol : null, rowCount, colLetters)
              setSelectedIds(selection.selectedIds)
              setFocusId(selection.focusId)
              setSelectAnchor(selection.anchorId)
            }}
            onContextMenu={(e) => onHeaderContextMenu(e, c)}
            title="우클릭으로 열 메뉴"
          >
            {prev && hiddenCols.has(prev) && <button className="unhide-col left" onClick={(e) => { e.stopPropagation(); showCol(prev) }} title={`${prev}열 숨김 표시`} aria-label={`${prev}열 숨김 표시`}>‹</button>}
            {c}
            {c === filterCol && <span className="filter-mark" aria-label={`${c}열 필터 적용`}>▾</span>}
            {next && hiddenCols.has(next) && <button className="unhide-col right" onClick={(e) => { e.stopPropagation(); showCol(next) }} title={`${next}열 숨김 표시`} aria-label={`${next}열 숨김 표시`}>›</button>}
            <ColResizer col={c} widthOf={widthOf} onResize={onResize} onResizeEnd={onResizeEnd} autoFitCol={autoFitCol} />
          </span>
        )
      })}
    </div>
  )
}
