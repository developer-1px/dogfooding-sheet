import { useEffect, useRef, useState } from 'react'
import type { Sheet, SheetOps } from './schema'
import { upsertKey } from '../lib/dictOps'

const DEFAULT_HEIGHT = 28
const MIN_HEIGHT = 18

export function useRowHeights(heights: Record<string, number>, ops: SheetOps) {
  const dragRef = useRef<{ row: number; startY: number; startH: number } | null>(null)
  const [live, setLive] = useState<{ row: number; h: number } | null>(null)
  const liveRef = useRef<{ row: number; h: number } | null>(null)
  liveRef.current = live

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current; if (!d) return
      setLive({ row: d.row, h: Math.max(MIN_HEIGHT, d.startH + (e.clientY - d.startY)) })
    }
    const onUp = () => {
      const d = dragRef.current
      if (d && liveRef.current && liveRef.current.row === d.row) {
        const v = Math.round(liveRef.current.h)
        upsertKey(ops, '/rowHeights', heights, String(d.row), v === DEFAULT_HEIGHT ? undefined : v)
      }
      dragRef.current = null; setLive(null); document.body.style.cursor = ''
    }
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [heights])

  const heightOf = (row: number): number =>
    live && live.row === row ? live.h : (heights[String(row)] ?? DEFAULT_HEIGHT)
  const setHeight = (row: number, h: number) => {
    const v = Math.max(MIN_HEIGHT, Math.round(h))
    upsertKey(ops, '/rowHeights', heights, String(row), v === DEFAULT_HEIGHT ? undefined : v)
  }
  const resetRowHeight = (row: number) => upsertKey(ops, '/rowHeights', heights, String(row), undefined)
  const startResizeRow = (row: number) => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragRef.current = { row, startY: e.clientY, startH: heights[String(row)] ?? DEFAULT_HEIGHT }
    document.body.style.cursor = 'row-resize'
  }
  return { heightOf, setHeight, startResizeRow, resetRowHeight, DEFAULT_HEIGHT, MIN_HEIGHT }
}
