import { useEffect, useState } from 'react'
import { COL_LETTERS, colIndex, type SheetOps } from '../schema'
import { upsertKey } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'
import { COLUMN_WIDTH_BOUNDS, clampResizeValue, storedResizeValue } from './resizeRules'

const LEGACY_KEY = 'spreadsheet:colwidths:v1'
export const DEFAULT_WIDTH = 100
export const MIN_WIDTH = COLUMN_WIDTH_BOUNDS.min
export const MAX_WIDTH = COLUMN_WIDTH_BOUNDS.max

interface ColumnWidthBounds {
  colCount: number
}

const validColumn = (col: string, bounds?: ColumnWidthBounds): boolean => {
  const index = colIndex(col)
  return index >= 0 && (bounds === undefined || index < bounds.colCount)
}

export const storedColumnWidth = (width: number): number | undefined => {
  const normalized = Number.isFinite(width) ? storedResizeValue(width, COLUMN_WIDTH_BOUNDS) : DEFAULT_WIDTH
  return normalized === DEFAULT_WIDTH ? undefined : normalized
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceColumnWidths = (raw: unknown, bounds?: ColumnWidthBounds): Record<string, number> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, number> = {}
  for (const [col, value] of Object.entries(raw)) {
    if (typeof value !== 'number' || !validColumn(col, bounds)) continue
    const width = storedColumnWidth(value)
    if (width !== undefined) out[col] = width
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export const setColumnWidth = (
  ops: SheetOps,
  widths: Record<string, number>,
  col: string,
  width: number,
  bounds?: ColumnWidthBounds,
) => {
  if (!validColumn(col, bounds)) return
  upsertKey(ops, '/colWidths', widths, col, storedColumnWidth(width))
}

const migrateLegacy = (widths: Record<string, number>, ops: SheetOps, bounds?: ColumnWidthBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(widths).length === 0, ops,
    (raw) => coerceColumnWidths(raw, bounds),
    (o, v) => o.replace('/colWidths', v),
  )

export function useColWidths(widths: Record<string, number>, ops: SheetOps, bounds?: ColumnWidthBounds) {
  // Live drag overlay — useResizeGesture's onChange writes here; onEnd commits to ops.
  // Single liveWidth state suffices (only one column resized at a time).
  const [liveWidth, setLiveWidth] = useState<{ col: string; w: number } | null>(null)
  const colCount = bounds?.colCount
  useEffect(() => { migrateLegacy(widths, ops, colCount === undefined ? undefined : { colCount }) }, [widths, ops, colCount])

  const autoFit = (col: string, samples: Iterable<string>) => {
    if (!validColumn(col, bounds)) return
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = '13px system-ui, sans-serif'
    let max = MIN_WIDTH
    for (const s of samples) {
      const w = Math.ceil(ctx.measureText(s).width) + 16
      if (w > max) max = w
    }
    setColumnWidth(ops, widths, col, clampResizeValue(max, COLUMN_WIDTH_BOUNDS), bounds)
  }

  const widthOf = (col: string) =>
    liveWidth && liveWidth.col === col ? liveWidth.w : (widths[col] ?? DEFAULT_WIDTH)

  const onResize = (col: string, w: number) => { if (validColumn(col, bounds)) setLiveWidth({ col, w }) }
  const onResizeEnd = (col: string, w: number) => {
    setColumnWidth(ops, widths, col, w, bounds)
    setLiveWidth(null)
  }

  const gridTemplateFor = (visibleCols: readonly string[] = COL_LETTERS) =>
    `48px ${visibleCols.map((c) => `${widthOf(c)}px`).join(' ')}`

  return { widthOf, gridTemplate: gridTemplateFor(), gridTemplateFor, autoFit, onResize, onResizeEnd, MIN_WIDTH }
}
