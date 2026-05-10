import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { upsertKey } from './lib/dictOps'

const DEFAULT_HEIGHT = 28
const MIN_HEIGHT = 18

export function useRowHeights(heights: Record<string, number>, ops: JsonOps<Sheet>) {
  const heightOf = (row: number): number => heights[String(row)] ?? DEFAULT_HEIGHT
  const setHeight = (row: number, h: number) => {
    const v = Math.max(MIN_HEIGHT, Math.round(h))
    upsertKey(ops, '/rowHeights', heights, String(row), v === DEFAULT_HEIGHT ? undefined : v)
  }
  return { heightOf, setHeight, DEFAULT_HEIGHT, MIN_HEIGHT }
}
