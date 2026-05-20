import { describe, expect, it } from 'vitest'
import type { SheetOps } from '../schema'
import { coerceLegacyFreeze, setFreezeState } from './useFreeze'

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
    } as unknown as SheetOps,
  }
}

describe('coerceLegacyFreeze', () => {
  it('clamps legacy freeze counts to sheet bounds', () => {
    expect(coerceLegacyFreeze({ rows: 5, cols: 3 }, { rowCount: 2, colCount: 2 })).toEqual({ rows: 2, cols: 2 })
  })

  it('drops invalid or empty legacy freeze state', () => {
    expect(coerceLegacyFreeze({ rows: 1.5, cols: -1 }, { rowCount: 2, colCount: 2 })).toBeUndefined()
    expect(coerceLegacyFreeze({ rows: 0, cols: 0 })).toBeUndefined()
    expect(coerceLegacyFreeze(null)).toBeUndefined()
  })
})

describe('setFreezeState', () => {
  it('skips writes when the normalized freeze state is unchanged', () => {
    const { ops, calls } = recordingOps()

    expect(setFreezeState(ops, { rows: 0, cols: 0 }, { rows: 0, cols: 0 })).toBe(false)
    expect(setFreezeState(ops, { rows: 2, cols: 1 }, { rows: 2, cols: 1 }, { rowCount: 5, colCount: 5 })).toBe(false)
    expect(setFreezeState(ops, { rows: 2, cols: 1 }, { rows: 10, cols: 1 }, { rowCount: 2, colCount: 5 })).toBe(false)

    expect(calls).toEqual([])
  })

  it('writes the bounded freeze state when it changes', () => {
    const { ops, calls } = recordingOps()

    expect(setFreezeState(ops, { rows: 0, cols: 0 }, { rows: 10, cols: 3 }, { rowCount: 2, colCount: 2 })).toBe(true)

    expect(calls).toEqual([
      ['replace', '/freeze', { rows: 2, cols: 2 }],
    ])
  })
})
