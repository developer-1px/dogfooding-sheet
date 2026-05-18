import { useRef, useState } from 'react'
import { type Cells, type WriteCell, type WriteMany } from '../schema'
import { fillSourceRect, fillTargetForCell, idsInFillTarget, rectEq, type Rect } from '@spredsheet/grid'
import { applyFill } from './applyFill'

interface Args {
  selectedIds: string[]
  focusId: string | null
  cells: Cells
  writeCell: WriteCell
  writeCells?: WriteMany
  setSelectedIds: (ids: string[]) => void
  rowCount: number
  colLetters: readonly string[]
}

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

export function useAutoFill({ selectedIds, focusId, cells, writeCell, writeCells, setSelectedIds, rowCount, colLetters }: Args) {
  const sourceRef = useRef<Rect | null>(null)

  const sourceRect = (): Rect | null => fillSourceRect(selectedIds, focusId)

  const fill = useFillHandleGesture({
    equals: rectEq,
    onCommit: (src, tgt) => {
      sourceRef.current = null
      applyFill(src, tgt, cells, writeCell, writeCells)
      setSelectedIds(idsInFillTarget(tgt, colLetters))
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
    const target = fillTargetForCell(src, id, { rowCount, colLetters })
    if (target) fill.setTarget(target)
  }

  return { onHandleMouseDown, onCellEnterDuringFill, preview: fill.preview, dragging: sourceRef.current !== null }
}
