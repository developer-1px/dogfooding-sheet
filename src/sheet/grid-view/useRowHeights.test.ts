import { describe, expect, it } from 'vitest'
import type { SheetOps } from '../schema'
import { coerceRowHeights, DEFAULT_HEIGHT, MIN_HEIGHT, setRowHeightValue, storedRowHeight } from './useRowHeights'

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
      remove: (path: never) => { calls.push(['remove', path]) },
    } as unknown as SheetOps,
  }
}

describe('row height writes', () => {
  it('omits default and invalid heights from document state', () => {
    expect(storedRowHeight(DEFAULT_HEIGHT)).toBeUndefined()
    expect(storedRowHeight(Number.NaN)).toBeUndefined()
  })

  it('rounds and clamps custom heights before storing them', () => {
    expect(storedRowHeight(31.6)).toBe(32)
    expect(storedRowHeight(1)).toBe(MIN_HEIGHT)
    expect(storedRowHeight(1001)).toBe(1000)
  })

  it('coerces legacy heights through row bounds and storage rules', () => {
    expect(coerceRowHeights({
      0: 12,
      1: 28,
      2: 44,
      bad: 40,
      3: 'tall',
    }, { rowCount: 2 })).toEqual({ 0: MIN_HEIGHT })
  })

  it('writes only valid rows when bounds are provided', () => {
    const { ops, calls } = recordingOps()

    setRowHeightValue(ops, {}, 2, 44, { rowCount: 2 })
    setRowHeightValue(ops, {}, -1, 44, { rowCount: 2 })
    setRowHeightValue(ops, {}, 1, 44, { rowCount: 2 })
    setRowHeightValue(ops, { '1': 44 }, 1, DEFAULT_HEIGHT, { rowCount: 2 })

    expect(calls).toEqual([
      ['add', '/rowHeights/1', 44],
      ['remove', '/rowHeights/1'],
    ])
  })
})
