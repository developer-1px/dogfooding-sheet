import { describe, expect, it } from 'vitest'
import type { SheetOps } from '../../../entities/Sheet/schema'
import { coerceColumnWidths, MAX_WIDTH, MIN_WIDTH, setColumnWidth, storedColumnWidth } from './useColWidths'

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

describe('storedColumnWidth', () => {
  it('omits default and invalid widths from document state', () => {
    expect(storedColumnWidth(100)).toBeUndefined()
    expect(storedColumnWidth(Number.NaN)).toBeUndefined()
  })

  it('rounds and clamps custom widths before storing them', () => {
    expect(storedColumnWidth(120.6)).toBe(121)
    expect(storedColumnWidth(1)).toBe(MIN_WIDTH)
    expect(storedColumnWidth(999)).toBe(MAX_WIDTH)
  })

  it('coerces legacy widths through column bounds and storage rules', () => {
    expect(coerceColumnWidths({
      A: 20,
      B: 100,
      C: 120,
      D: 'wide',
    }, { colCount: 2 })).toEqual({ A: MIN_WIDTH })
  })

  it('writes only valid columns when bounds are provided', () => {
    const { ops, calls } = recordingOps()

    setColumnWidth(ops, {}, 'C', 120, { colCount: 2 })
    setColumnWidth(ops, {}, 'bad', 120, { colCount: 2 })
    setColumnWidth(ops, {}, 'B', 120, { colCount: 2 })
    setColumnWidth(ops, { B: 120 }, 'B', 100, { colCount: 2 })

    expect(calls).toEqual([
      ['add', '/colWidths/B', 120],
      ['remove', '/colWidths/B'],
    ])
  })
})
