import { useResizeGesture } from '@interactive-os/aria-kernel/gesture'
import { selectRowHeader } from './headerSelection'
import { rowRestoreControls } from './hiddenRestoreControls'
import { ROW_HEIGHT_BOUNDS, resizeValueForKey } from '@spredsheet/editable-grid/resize-rules'

interface Props {
  rIdx: number
  focusId: string | null
  setFocusId: (id: string) => void
  setSelectAnchor: (id: string | null) => void
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
  active: boolean
}

function RowResizer({ rIdx, heightOf, onResize, onResizeEnd, resetRowHeight }: Pick<Props, 'rIdx' | 'heightOf' | 'onResize' | 'onResizeEnd' | 'resetRowHeight'>) {
  const height = heightOf(rIdx)
  const { handleProps } = useResizeGesture({
    axis: 'y',
    initial: () => heightOf(rIdx),
    onChange: (h) => onResize(rIdx, h),
    onEnd: (h) => onResizeEnd(rIdx, h),
    min: ROW_HEIGHT_BOUNDS.min,
    max: ROW_HEIGHT_BOUNDS.max,
  })
  return (
    <span
      className="row-resizer row-resize"
      {...handleProps}
      role="separator"
      tabIndex={0}
      aria-label={`${rIdx + 1}행 높이 조정`}
      aria-keyshortcuts="ArrowUp ArrowDown Shift+ArrowUp Shift+ArrowDown"
      aria-orientation="horizontal"
      aria-valuemin={ROW_HEIGHT_BOUNDS.min}
      aria-valuemax={ROW_HEIGHT_BOUNDS.max}
      aria-valuenow={Math.round(height)}
      onKeyDown={(e) => {
        const next = resizeValueForKey(heightOf(rIdx), e.key, e.shiftKey, 'y', ROW_HEIGHT_BOUNDS)
        if (next === null) return
        e.preventDefault()
        e.stopPropagation()
        onResizeEnd(rIdx, next)
      }}
      onDoubleClick={(e) => { e.stopPropagation(); resetRowHeight(rIdx) }}
      title="드래그=높이 조정 / ↑ ↓ 키로 10px 조정 / Shift+↑ ↓ 키로 50px 조정 / 더블클릭=기본값 복원"
    />
  )
}

export function RowHeader({ rIdx, focusId, setFocusId, setSelectAnchor, setSelectedIds, heightOf, onResize, onResizeEnd, resetRowHeight, onContextMenu, colLetters, hiddenRows, showRow, selected, active }: Props) {
  const restoreControls = rowRestoreControls(rIdx, hiddenRows)
  const topRestore = restoreControls.find((control) => control.className === 'unhide-row top')
  const bottomRestore = restoreControls.find((control) => control.className === 'unhide-row bottom')
  const selectRow = (extend: boolean) => {
    const selection = selectRowHeader(rIdx, extend ? focusId : null, colLetters)
    setSelectedIds(selection.selectedIds)
    setFocusId(selection.focusId)
    setSelectAnchor(selection.anchorId)
  }
  const restoreButton = (control: typeof restoreControls[number]) => (
    <button
      key={control.row}
      type="button"
      className={control.className}
      onClick={(e) => { e.stopPropagation(); showRow(control.row) }}
      title={control.label}
      aria-label={control.label}
    >
      {control.marker}
    </button>
  )

  return (
    <span
      className={`row-header${selected ? ' selected-header' : ''}`}
      role="rowheader"
      tabIndex={0}
      aria-label={`${rIdx + 1}행`}
      aria-current={active ? 'true' : undefined}
      aria-selected={selected}
      onClick={(e) => selectRow(e.shiftKey)}
      onKeyDown={(e) => {
        if (e.currentTarget !== e.target) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        selectRow(e.shiftKey)
      }}
      onContextMenu={onContextMenu}
      title="클릭=행 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 아래쪽 가장자리 드래그=높이 조정"
    >
      {topRestore && restoreButton(topRestore)}
      {rIdx + 1}
      {bottomRestore && restoreButton(bottomRestore)}
      <RowResizer rIdx={rIdx} heightOf={heightOf} onResize={onResize} onResizeEnd={onResizeEnd} resetRowHeight={resetRowHeight} />
    </span>
  )
}
