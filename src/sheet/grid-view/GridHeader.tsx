import { useResizeGesture } from '@interactive-os/aria-kernel/gesture'
import { selectAllHeaders, selectColumnHeader } from './headerSelection'
import { columnRestoreControls } from './hiddenRestoreControls'
import { COLUMN_WIDTH_BOUNDS, resizeValueForKey } from '@spredsheet/editable-grid/resize-rules'
import type { SheetGridItemProps } from './gridTypes'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => SheetGridItemProps
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
      aria-keyshortcuts="ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight"
      aria-orientation="vertical"
      aria-valuemin={COLUMN_WIDTH_BOUNDS.min}
      aria-valuemax={COLUMN_WIDTH_BOUNDS.max}
      aria-valuenow={Math.round(width)}
      onKeyDown={(e) => {
        const next = resizeValueForKey(widthOf(col), e.key, e.shiftKey, 'x', COLUMN_WIDTH_BOUNDS)
        if (next === null) return
        e.preventDefault()
        e.stopPropagation()
        onResizeEnd(col, next)
      }}
      onDoubleClick={(e) => { e.stopPropagation(); autoFitCol(col) }}
      title="드래그로 너비 조정 / ← → 키로 10px 조정 / Shift+← → 키로 50px 조정 / 더블클릭 자동 맞춤"
    />
  )
}

export function GridHeader({ gridTemplate, columnHeaderProps, widthOf, onResize, onResizeEnd, autoFitCol, setSelectedIds, setFocusId, setSelectAnchor, hiddenCols, showCol, filterCol, focusCol, selectedCols, allSelected, onHeaderContextMenu, rowCount, colLetters }: Props) {
  const selectAll = () => {
    const selection = selectAllHeaders(rowCount, colLetters)
    setSelectedIds(selection.selectedIds)
    setFocusId(selection.focusId)
    setSelectAnchor(selection.anchorId)
  }

  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span
        className={`corner-cell${allSelected ? ' selected-header' : ''}`}
        role="columnheader"
        tabIndex={0}
        aria-label="전체 시트 선택"
        aria-selected={allSelected}
        title="전체 시트 선택"
        onClick={selectAll}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          e.stopPropagation()
          selectAll()
        }}
      />
      {colLetters.map((c) => {
        if (hiddenCols.has(c)) return null
        const headerProps = columnHeaderProps(`h-${c}`)
        const restoreControls = columnRestoreControls(c, colLetters, hiddenCols)
        const leftRestore = restoreControls.find((control) => control.className === 'unhide-col left')
        const rightRestore = restoreControls.find((control) => control.className === 'unhide-col right')
        const isFiltered = c === filterCol
        const selectColumn = (extend: boolean) => {
          const selection = selectColumnHeader(c, extend ? focusCol : null, rowCount, colLetters)
          setSelectedIds(selection.selectedIds)
          setFocusId(selection.focusId)
          setSelectAnchor(selection.anchorId)
        }
        const restoreButton = (control: typeof restoreControls[number]) => (
          <button
            key={control.col}
            type="button"
            className={control.className}
            onClick={(e) => { e.stopPropagation(); showCol(control.col) }}
            onKeyDown={(e) => e.stopPropagation()}
            title={control.label}
            aria-label={control.label}
          >
            {control.marker}
          </button>
        )
        return (
          <span
            key={c}
            {...headerProps}
            className={`header-cell${c === focusCol ? ' active' : ''}${selectedCols.has(c) ? ' selected-header' : ''}${isFiltered ? ' filtered' : ''}`}
            aria-label={isFiltered ? `${c}열 필터 적용` : `${c}열`}
            aria-current={c === focusCol ? 'true' : undefined}
            aria-selected={selectedCols.has(c)}
            onClick={(e) => selectColumn(e.shiftKey)}
            onKeyDown={(e) => {
              if (e.currentTarget !== e.target) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                selectColumn(e.shiftKey)
                return
              }
              headerProps.onKeyDown?.(e)
            }}
            onContextMenu={(e) => onHeaderContextMenu(e, c)}
            title="클릭=열 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 오른쪽 가장자리 드래그=너비 조정"
          >
            {leftRestore && restoreButton(leftRestore)}
            {c}
            {isFiltered && <span className="filter-mark" aria-hidden>▾</span>}
            {rightRestore && restoreButton(rightRestore)}
            <ColResizer col={c} widthOf={widthOf} onResize={onResize} onResizeEnd={onResizeEnd} autoFitCol={autoFitCol} />
          </span>
        )
      })}
    </div>
  )
}
