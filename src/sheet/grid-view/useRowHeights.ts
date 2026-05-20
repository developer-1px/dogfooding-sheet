import { useEffect, useState } from 'react'
import type { SheetOps } from '../schema'
import { upsertKey } from '../../lib/dictOps'
import { ROW_HEIGHT_BOUNDS, clampResizeValue, storedResizeValue } from './resizeRules'

export const DEFAULT_HEIGHT = 28
export const MIN_HEIGHT = ROW_HEIGHT_BOUNDS.min

interface RowHeightBounds {
  rowCount: number
}

const validRow = (row: number, bounds?: RowHeightBounds): boolean =>
  Number.isInteger(row) && row >= 0 && (bounds === undefined || row < bounds.rowCount)

export const storedRowHeight = (height: number): number | undefined => {
  const normalized = Number.isFinite(height) ? storedResizeValue(height, ROW_HEIGHT_BOUNDS) : DEFAULT_HEIGHT
  return normalized === DEFAULT_HEIGHT ? undefined : normalized
}

export const setRowHeightValue = (
  ops: SheetOps,
  heights: Record<string, number>,
  row: number,
  height: number | undefined,
  bounds?: RowHeightBounds,
) => {
  if (!validRow(row, bounds)) return
  const stored = height === undefined ? undefined : storedRowHeight(height)
  upsertKey(ops, '/rowHeights', heights, String(row), stored)
}

export function useRowHeights(heights: Record<string, number>, ops: SheetOps, bounds?: RowHeightBounds) {
  const [live, setLive] = useState<{ row: number; h: number } | null>(null)
  useEffect(() => { /* migration slot kept for parity */ }, [])

  const heightOf = (row: number): number =>
    live && live.row === row ? live.h : (heights[String(row)] ?? DEFAULT_HEIGHT)
  const setHeight = (row: number, h: number) => {
    setRowHeightValue(ops, heights, row, h, bounds)
  }
  const resetRowHeight = (row: number) => setRowHeightValue(ops, heights, row, undefined, bounds)

  const onResize = (row: number, h: number) => { if (validRow(row, bounds)) setLive({ row, h: clampResizeValue(h, ROW_HEIGHT_BOUNDS) }) }
  const onResizeEnd = (row: number, h: number) => {
    setRowHeightValue(ops, heights, row, h, bounds)
    setLive(null)
  }

  return { heightOf, setHeight, resetRowHeight, onResize, onResizeEnd }
}
