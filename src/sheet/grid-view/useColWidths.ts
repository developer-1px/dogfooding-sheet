import { useEffect, useState } from 'react'
import { COL_LETTERS, type SheetOps } from '../schema'
import { upsertKey } from '../../lib/dictOps'
import { migrateLegacyKey } from '../../lib/legacyMigrate'
import { COLUMN_WIDTH_BOUNDS, clampResizeValue, storedResizeValue } from './resizeRules'

const LEGACY_KEY = 'spreadsheet:colwidths:v1'
export const DEFAULT_WIDTH = 100
export const MIN_WIDTH = COLUMN_WIDTH_BOUNDS.min
export const MAX_WIDTH = COLUMN_WIDTH_BOUNDS.max

export const storedColumnWidth = (width: number): number | undefined => {
  const normalized = Number.isFinite(width) ? storedResizeValue(width, COLUMN_WIDTH_BOUNDS) : DEFAULT_WIDTH
  return normalized === DEFAULT_WIDTH ? undefined : normalized
}

export const setColumnWidth = (
  ops: SheetOps,
  widths: Record<string, number>,
  col: string,
  width: number,
) => upsertKey(ops, '/colWidths', widths, col, storedColumnWidth(width))

const migrateLegacy = (widths: Record<string, number>, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(widths).length === 0, ops,
    (raw) => raw && typeof raw === 'object' && Object.keys(raw).length > 0 ? raw as Record<string, number> : undefined,
    (o, v) => o.replace('/colWidths', v),
  )

export function useColWidths(widths: Record<string, number>, ops: SheetOps) {
  // Live drag overlay — useResizeGesture's onChange writes here; onEnd commits to ops.
  // Single liveWidth state suffices (only one column resized at a time).
  const [liveWidth, setLiveWidth] = useState<{ col: string; w: number } | null>(null)
  useEffect(() => { migrateLegacy(widths, ops) }, [widths, ops])

  const autoFit = (col: string, samples: string[]) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.font = '13px system-ui, sans-serif'
    let max = MIN_WIDTH
    for (const s of samples) {
      const w = Math.ceil(ctx.measureText(s).width) + 16
      if (w > max) max = w
    }
    setColumnWidth(ops, widths, col, clampResizeValue(max, COLUMN_WIDTH_BOUNDS))
  }

  const widthOf = (col: string) =>
    liveWidth && liveWidth.col === col ? liveWidth.w : (widths[col] ?? DEFAULT_WIDTH)

  const onResize = (col: string, w: number) => setLiveWidth({ col, w })
  const onResizeEnd = (col: string, w: number) => {
    setColumnWidth(ops, widths, col, w)
    setLiveWidth(null)
  }

  const gridTemplateFor = (visibleCols: readonly string[] = COL_LETTERS) =>
    `48px ${visibleCols.map((c) => `${widthOf(c)}px`).join(' ')}`

  return { widthOf, gridTemplate: gridTemplateFor(), gridTemplateFor, autoFit, onResize, onResizeEnd, MIN_WIDTH }
}
