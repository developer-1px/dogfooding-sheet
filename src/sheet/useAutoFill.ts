import { useEffect, useRef, useState } from 'react'
import { COL_LETTERS, ROW_COUNT, parseCellId } from './schema'
import { rectFromIds, type Rect } from '../lib/rect'
import { applyFill } from '../lib/applyFill'

interface Args {
  selectedIds: string[]
  focusId: string | null
  cells: Record<string, string>
  writeCell: (k: string, v: string) => void
  writeCells?: (writes: Array<[string, string]>) => void
  setSelectedIds: (ids: string[]) => void
}

const colIdx = (c: string) => COL_LETTERS.indexOf(c as (typeof COL_LETTERS)[number])

export function useAutoFill({ selectedIds, focusId, cells, writeCell, writeCells, setSelectedIds }: Args) {
  const [preview, setPreview] = useState<Rect | null>(null)
  const sourceRef = useRef<Rect | null>(null)

  const sourceRect = (): Rect | null => {
    if (selectedIds.length > 1) return rectFromIds(selectedIds)
    if (focusId) {
      const p = parseCellId(focusId)
      if (p) {
        const ci = colIdx(p.col)
        return { rMin: p.row, rMax: p.row, cMin: ci, cMax: ci }
      }
    }
    return null
  }

  const onHandleMouseDown = (e: React.MouseEvent) => {
    const src = sourceRect()
    if (!src) return
    e.preventDefault()
    e.stopPropagation()
    sourceRef.current = src
    setPreview(src)
  }

  const onCellEnterDuringFill = (cellId: string) => {
    if (!sourceRef.current) return
    const p = parseCellId(cellId)
    if (!p) return
    const src = sourceRef.current
    const ci = colIdx(p.col)
    // Extend either downward or rightward — whichever is larger delta
    const dRow = p.row - src.rMax
    const dCol = ci - src.cMax
    if (dRow <= 0 && dCol <= 0) { setPreview(src); return }
    if (dRow >= dCol) setPreview({ ...src, rMax: Math.min(ROW_COUNT - 1, p.row) })
    else setPreview({ ...src, cMax: Math.min(COL_LETTERS.length - 1, ci) })
  }

  useEffect(() => {
    if (!sourceRef.current) return
    const onUp = () => {
      const src = sourceRef.current!
      const tgt = preview
      sourceRef.current = null
      setPreview(null)
      if (!tgt || (tgt.rMax === src.rMax && tgt.cMax === src.cMax)) return
      applyFill(src, tgt, cells, writeCell, writeCells)
      // Re-select the filled rect
      const ids: string[] = []
      for (let r = tgt.rMin; r <= tgt.rMax; r++) {
        for (let c = tgt.cMin; c <= tgt.cMax; c++) ids.push(`r${r}-${COL_LETTERS[c]}`)
      }
      setSelectedIds(ids)
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [preview, cells, writeCell, setSelectedIds])

  return { onHandleMouseDown, onCellEnterDuringFill, preview, dragging: !!sourceRef.current }
}

