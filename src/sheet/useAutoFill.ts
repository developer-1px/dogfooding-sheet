import { useRef } from 'react'
import { useFillHandleGesture } from '@p/aria-kernel/gesture/lab/useFillHandleGesture'
import { COL_LETTERS, ROW_COUNT, parseCellId, colIndex, cellId, type Cells, type WriteCell, type WriteMany } from './schema'
import { rectFromIds, rectOfCell, type Rect } from '../lib/rect'
import { applyFill } from '../lib/applyFill'

interface Args {
  selectedIds: string[]
  focusId: string | null
  cells: Cells
  writeCell: WriteCell
  writeCells?: WriteMany
  setSelectedIds: (ids: string[]) => void
}

const rectEq = (a: Rect, b: Rect) => a.rMin === b.rMin && a.rMax === b.rMax && a.cMin === b.cMin && a.cMax === b.cMax

export function useAutoFill({ selectedIds, focusId, cells, writeCell, writeCells, setSelectedIds }: Args) {
  const sourceRef = useRef<Rect | null>(null)

  const sourceRect = (): Rect | null => {
    if (selectedIds.length > 1) return rectFromIds(selectedIds)
    if (focusId) {
      const p = parseCellId(focusId)
      if (p) return rectOfCell(p)
    }
    return null
  }

  const fill = useFillHandleGesture<Rect>({
    equals: rectEq,
    onCommit: (src, tgt) => {
      sourceRef.current = null
      applyFill(src, tgt, cells, writeCell, writeCells)
      const ids: string[] = []
      for (let r = tgt.rMin; r <= tgt.rMax; r++) {
        for (let c = tgt.cMin; c <= tgt.cMax; c++) ids.push(cellId(COL_LETTERS[c], r))
      }
      setSelectedIds(ids)
    },
  })

  const onHandleMouseDown = (e: React.MouseEvent) => {
    const src = sourceRect()
    if (!src) return
    e.stopPropagation()
    sourceRef.current = src
    fill.handleProps(src).onMouseDown(e)
  }

  const onCellEnterDuringFill = (id: string) => {
    const src = sourceRef.current
    if (!src) return
    const p = parseCellId(id)
    if (!p) return
    const ci = colIndex(p.col)
    const dRow = p.row - src.rMax
    const dCol = ci - src.cMax
    if (dRow <= 0 && dCol <= 0) { fill.setTarget(src); return }
    if (dRow >= dCol) fill.setTarget({ ...src, rMax: Math.min(ROW_COUNT - 1, p.row) })
    else fill.setTarget({ ...src, cMax: Math.min(COL_LETTERS.length - 1, ci) })
  }

  return { onHandleMouseDown, onCellEnterDuringFill, preview: fill.preview, dragging: sourceRef.current !== null }
}
