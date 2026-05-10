import { COL_LETTERS } from './schema'
import { idsForCol, idsForAll } from '../lib/range'
import { ROW_COUNT } from './schema'
import type { ItemProps } from '@p/aria-kernel/patterns/types'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => ItemProps
  startResize: (col: string) => (e: React.MouseEvent) => void
  setSelectedIds: (ids: string[]) => void
  hiddenCols: Set<string>
  hideCol: (col: string) => void
}

export function GridHeader({ gridTemplate, columnHeaderProps, startResize, setSelectedIds, hiddenCols, hideCol }: Props) {
  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span className="corner-cell" onClick={() => setSelectedIds(idsForAll(ROW_COUNT))} />
      {COL_LETTERS.map((c) => {
        if (hiddenCols.has(c)) return null
        return (
          <span
            key={c}
            {...columnHeaderProps(`h-${c}`)}
            className="header-cell"
            onClick={() => setSelectedIds(idsForCol(c, ROW_COUNT))}
            onContextMenu={(e) => { e.preventDefault(); hideCol(c) }}
            title="우클릭으로 열 숨기기"
          >
            {c}
            <span className="col-resizer" onMouseDown={startResize(c)} />
          </span>
        )
      })}
    </div>
  )
}
