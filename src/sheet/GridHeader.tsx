import { COL_LETTERS } from './schema'
import { idsForCol, idsForAll } from './range'
import type { ItemProps } from '@p/aria-kernel/patterns/types'

interface Props {
  gridTemplate: string
  columnHeaderProps: (id: string) => ItemProps
  startResize: (col: string) => (e: React.MouseEvent) => void
  setSelectedIds: (ids: string[]) => void
}

export function GridHeader({ gridTemplate, columnHeaderProps, startResize, setSelectedIds }: Props) {
  return (
    <div role="row" className="grid-row header-row" style={{ gridTemplateColumns: gridTemplate }}>
      <span className="corner-cell" onClick={() => setSelectedIds(idsForAll())} />
      {COL_LETTERS.map((c) => (
        <span
          key={c}
          {...columnHeaderProps(`h-${c}`)}
          className="header-cell"
          onClick={() => setSelectedIds(idsForCol(c))}
        >
          {c}
          <span className="col-resizer" onMouseDown={startResize(c)} />
        </span>
      ))}
    </div>
  )
}
