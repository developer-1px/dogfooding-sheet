import { COL_LETTERS } from './schema'
import { idsForCol, idsForAll } from '../lib/range'
import { ROW_COUNT } from './schema'
import type { ItemProps } from '@p/aria-kernel/patterns/types'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => ItemProps
  startResize: (col: string) => (e: React.MouseEvent) => void
  autoFitCol: (col: string) => void
  setSelectedIds: (ids: string[]) => void
  hiddenCols: Set<string>
  focusCol: string | null
  onHeaderContextMenu: (e: React.MouseEvent, col: string) => void
}

export function GridHeader({ gridTemplate, columnHeaderProps, startResize, autoFitCol, setSelectedIds, hiddenCols, focusCol, onHeaderContextMenu }: Props) {
  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span className="corner-cell" onClick={() => setSelectedIds(idsForAll(ROW_COUNT))} />
      {COL_LETTERS.map((c) => {
        if (hiddenCols.has(c)) return null
        return (
          <span
            key={c}
            {...columnHeaderProps(`h-${c}`)}
            className={`header-cell${c === focusCol ? ' active' : ''}`}
            onClick={() => setSelectedIds(idsForCol(c, ROW_COUNT))}
            onContextMenu={(e) => onHeaderContextMenu(e, c)}
            title="우클릭으로 열 메뉴"
          >
            {c}
            <span className="col-resizer" onMouseDown={startResize(c)} onDoubleClick={(e) => { e.stopPropagation(); autoFitCol(c) }} title="드래그로 너비 조정 / 더블클릭 자동 맞춤" />
          </span>
        )
      })}
    </div>
  )
}
