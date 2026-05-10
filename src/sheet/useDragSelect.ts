import { useEffect, useRef } from 'react'
import { COL_LETTERS, parseCellId, cellKey } from './schema'

const colIdx = (c: string) => COL_LETTERS.indexOf(c as (typeof COL_LETTERS)[number])

const rangeIds = (a: { col: string; row: number }, b: { col: string; row: number }): string[] => {
  const c1 = colIdx(a.col), c2 = colIdx(b.col)
  const r1 = a.row, r2 = b.row
  const out: string[] = []
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      out.push(`r${r}-${COL_LETTERS[c]}`)
    }
  }
  return out
}

interface Args {
  focusId: string | null
  setFocusId: (id: string) => void
  setSelectedIds: (ids: string[]) => void
}

export function useDragSelect({ focusId, setFocusId, setSelectedIds }: Args) {
  const anchor = useRef<string | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const onUp = () => { dragging.current = false }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const onMouseDown = (id: string, e: React.MouseEvent) => {
    const p = parseCellId(id)
    if (!p) return
    if (e.shiftKey && focusId) {
      const a = parseCellId(focusId)
      if (a) setSelectedIds(rangeIds(a, p))
      return
    }
    anchor.current = id
    dragging.current = true
    setFocusId(id)
    setSelectedIds([id])
  }

  const onMouseEnter = (id: string) => {
    if (!dragging.current || !anchor.current) return
    const a = parseCellId(anchor.current)
    const b = parseCellId(id)
    if (!a || !b) return
    setSelectedIds(rangeIds(a, b))
  }

  return { onMouseDown, onMouseEnter }
}

export const cellOf = (id: string) => {
  const p = parseCellId(id)
  return p ? cellKey(p.col, p.row) : null
}
