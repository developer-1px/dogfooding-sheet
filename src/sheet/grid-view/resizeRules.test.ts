import { describe, expect, it } from 'vitest'
import { COLUMN_WIDTH_BOUNDS, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT, ROW_HEIGHT_BOUNDS, clampResizeValue, resizeValueForKey, storedResizeValue } from './resizeRules'

describe('resize rules', () => {
  it('clamps live resize values to min and optional max bounds', () => {
    expect(clampResizeValue(1, COLUMN_WIDTH_BOUNDS)).toBe(40)
    expect(clampResizeValue(999, COLUMN_WIDTH_BOUNDS)).toBe(400)
    expect(clampResizeValue(1, ROW_HEIGHT_BOUNDS)).toBe(18)
    expect(clampResizeValue(999, ROW_HEIGHT_BOUNDS)).toBe(999)
  })

  it('rounds values only for storage', () => {
    expect(storedResizeValue(120.6, COLUMN_WIDTH_BOUNDS)).toBe(121)
    expect(DEFAULT_COLUMN_WIDTH).toBe(100)
    expect(DEFAULT_ROW_HEIGHT).toBe(28)
  })

  it('maps horizontal keyboard resize keys to bounded values', () => {
    expect(resizeValueForKey(100, 'ArrowLeft', false, 'x', COLUMN_WIDTH_BOUNDS)).toBe(90)
    expect(resizeValueForKey(100, 'ArrowRight', true, 'x', COLUMN_WIDTH_BOUNDS)).toBe(150)
    expect(resizeValueForKey(40, 'ArrowLeft', true, 'x', COLUMN_WIDTH_BOUNDS)).toBe(40)
    expect(resizeValueForKey(390, 'ArrowRight', true, 'x', COLUMN_WIDTH_BOUNDS)).toBe(400)
    expect(resizeValueForKey(100, 'ArrowUp', false, 'x', COLUMN_WIDTH_BOUNDS)).toBeNull()
  })

  it('maps vertical keyboard resize keys to bounded values', () => {
    expect(resizeValueForKey(28, 'ArrowUp', false, 'y', ROW_HEIGHT_BOUNDS)).toBe(18)
    expect(resizeValueForKey(28, 'ArrowDown', true, 'y', ROW_HEIGHT_BOUNDS)).toBe(78)
    expect(resizeValueForKey(28, 'ArrowRight', false, 'y', ROW_HEIGHT_BOUNDS)).toBeNull()
  })
})
