import { useEffect, useState } from 'react'
import { DEFAULT_ROW_HEIGHT, ROW_HEIGHT_BOUNDS, clampResizeValue, storedResizeValue } from '@spredsheet/editable-grid/resize-rules'
import type { SheetOps } from '../schema'
import { upsertKey, type RecordMutationCommands } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

const LEGACY_KEY = 'spreadsheet:rowheights:v1'
export const DEFAULT_HEIGHT = DEFAULT_ROW_HEIGHT
export const MIN_HEIGHT = ROW_HEIGHT_BOUNDS.min

interface RowHeightBounds {
  rowCount: number
}

const validRow = (row: number, bounds?: RowHeightBounds): boolean =>
  Number.isInteger(row) && row >= 0 && (bounds === undefined || row < bounds.rowCount)

const validRowKey = (key: string, bounds?: RowHeightBounds): boolean =>
  /^\d+$/.test(key) && validRow(Number(key), bounds)

export const storedRowHeight = (height: number): number | undefined => {
  const normalized = Number.isFinite(height) ? storedResizeValue(height, ROW_HEIGHT_BOUNDS) : DEFAULT_HEIGHT
  return normalized === DEFAULT_HEIGHT ? undefined : normalized
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceRowHeights = (raw: unknown, bounds?: RowHeightBounds): Record<string, number> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, number> = {}
  for (const [row, value] of Object.entries(raw)) {
    if (typeof value !== 'number' || !validRowKey(row, bounds)) continue
    const height = storedRowHeight(value)
    if (height !== undefined) out[row] = height
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export const setRowHeightValue = (
  ops: SheetOps,
  heights: Record<string, number>,
  row: number,
  height: number | undefined,
  bounds?: RowHeightBounds,
  commands?: RecordMutationCommands<number>,
) => {
  if (!validRow(row, bounds)) return
  const stored = height === undefined ? undefined : storedRowHeight(height)
  upsertKey(ops, '/rowHeights', heights, String(row), stored, undefined, commands)
}

const migrateLegacy = (heights: Record<string, number>, ops: SheetOps, bounds?: RowHeightBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(heights).length === 0, ops,
    (raw) => coerceRowHeights(raw, bounds),
    (o, v) => o.replace('/rowHeights', v),
  )

export function useRowHeights(heights: Record<string, number>, ops: SheetOps, bounds?: RowHeightBounds, commands?: RecordMutationCommands<number>) {
  const [live, setLive] = useState<{ row: number; h: number } | null>(null)
  const rowCount = bounds?.rowCount
  useEffect(() => { migrateLegacy(heights, ops, rowCount === undefined ? undefined : { rowCount }) }, [heights, ops, rowCount])

  const heightOf = (row: number): number =>
    live && live.row === row ? live.h : (heights[String(row)] ?? DEFAULT_HEIGHT)
  const setHeight = (row: number, h: number) => {
    setRowHeightValue(ops, heights, row, h, bounds, commands)
  }
  const resetRowHeight = (row: number) => setRowHeightValue(ops, heights, row, undefined, bounds, commands)

  const onResize = (row: number, h: number) => { if (validRow(row, bounds)) setLive({ row, h: clampResizeValue(h, ROW_HEIGHT_BOUNDS) }) }
  const onResizeEnd = (row: number, h: number) => {
    setRowHeightValue(ops, heights, row, h, bounds, commands)
    setLive(null)
  }

  return { heightOf, setHeight, resetRowHeight, onResize, onResizeEnd }
}
