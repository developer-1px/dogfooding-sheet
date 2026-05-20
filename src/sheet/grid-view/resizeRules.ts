export interface ResizeBounds {
  min: number
  max?: number
}

export const COLUMN_WIDTH_BOUNDS = { min: 40, max: 400 } satisfies ResizeBounds
export const ROW_HEIGHT_BOUNDS = { min: 18 } satisfies ResizeBounds

const STEP = 10
const LARGE_STEP = 50

export function clampResizeValue(value: number, bounds: ResizeBounds): number {
  const finite = Number.isFinite(value) ? value : bounds.min
  const minClamped = Math.max(bounds.min, finite)
  return bounds.max === undefined ? minClamped : Math.min(bounds.max, minClamped)
}

export function storedResizeValue(value: number, bounds: ResizeBounds): number {
  return Math.round(clampResizeValue(value, bounds))
}

export function resizeValueForKey(
  current: number,
  key: string,
  shiftKey: boolean,
  axis: 'x' | 'y',
  bounds: ResizeBounds,
): number | null {
  const step = shiftKey ? LARGE_STEP : STEP
  const delta =
    axis === 'x'
      ? key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : null
      : key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : null

  return delta === null ? null : clampResizeValue(current + delta, bounds)
}
