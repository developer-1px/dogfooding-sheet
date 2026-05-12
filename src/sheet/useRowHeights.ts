import { useEffect, useState } from 'react'
import type { SheetOps } from './schema'
import { upsertKey } from '../lib/dictOps'

export const DEFAULT_HEIGHT = 28
export const MIN_HEIGHT = 18

export function useRowHeights(heights: Record<string, number>, ops: SheetOps) {
  const [live, setLive] = useState<{ row: number; h: number } | null>(null)
  useEffect(() => { /* migration slot kept for parity */ }, [])

  const heightOf = (row: number): number =>
    live && live.row === row ? live.h : (heights[String(row)] ?? DEFAULT_HEIGHT)
  const setHeight = (row: number, h: number) => {
    const v = Math.max(MIN_HEIGHT, Math.round(h))
    upsertKey(ops, '/rowHeights', heights, String(row), v === DEFAULT_HEIGHT ? undefined : v)
  }
  const resetRowHeight = (row: number) => upsertKey(ops, '/rowHeights', heights, String(row), undefined)

  const onResize = (row: number, h: number) => setLive({ row, h: Math.max(MIN_HEIGHT, h) })
  const onResizeEnd = (row: number, h: number) => {
    const v = Math.max(MIN_HEIGHT, Math.round(h))
    upsertKey(ops, '/rowHeights', heights, String(row), v === DEFAULT_HEIGHT ? undefined : v)
    setLive(null)
  }

  return { heightOf, setHeight, resetRowHeight, onResize, onResizeEnd }
}
