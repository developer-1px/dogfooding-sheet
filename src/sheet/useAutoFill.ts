import { useRef, useState } from 'react'
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

function useFillHandleGesture(args: {
  equals: (a: Rect, b: Rect) => boolean
  onCommit: (source: Rect, target: Rect) => void
}) {
  const sourceRef = useRef<Rect | null>(null)
  const targetRef = useRef<Rect | null>(null)
  const [preview, setPreview] = useState<Rect | null>(null)

  const clear = () => {
    sourceRef.current = null
    targetRef.current = null
    setPreview(null)
  }

  const commit = () => {
    const source = sourceRef.current
    const target = targetRef.current
    if (source && target && !args.equals(source, target)) args.onCommit(source, target)
    clear()
  }

  return {
    preview,
    setTarget(target: Rect) {
      targetRef.current = target
      setPreview(target)
    },
    handleProps(source: Rect) {
      return {
        onMouseDown(_event: React.MouseEvent) {
          sourceRef.current = source
          targetRef.current = source
          setPreview(source)
          window.addEventListener('mouseup', commit, { once: true })
        },
      }
    },
  }
}

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

  const fill = useFillHandleGesture({
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
