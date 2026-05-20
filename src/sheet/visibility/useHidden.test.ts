import { describe, expect, it } from 'vitest'
import { nextHiddenState, type HiddenState } from './useHidden'

describe('nextHiddenState', () => {
  const hidden: HiddenState = { rows: [1], cols: ['B'] }

  it('adds hidden rows and columns without mutating the current state', () => {
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 3 })).toEqual({ rows: [1, 3], cols: ['B'] })
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'D' })).toEqual({ rows: [1], cols: ['B', 'D'] })
    expect(hidden).toEqual({ rows: [1], cols: ['B'] })
  })

  it('returns null for duplicate hide requests', () => {
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 1 })).toBeNull()
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'B' })).toBeNull()
  })

  it('removes hidden rows and columns only when present', () => {
    expect(nextHiddenState(hidden, { type: 'showRow', row: 1 })).toEqual({ rows: [], cols: ['B'] })
    expect(nextHiddenState(hidden, { type: 'showCol', col: 'B' })).toEqual({ rows: [1], cols: [] })
    expect(nextHiddenState(hidden, { type: 'showRow', row: 4 })).toBeNull()
    expect(nextHiddenState(hidden, { type: 'showCol', col: 'C' })).toBeNull()
  })

  it('clears all hidden rows and columns when needed', () => {
    expect(nextHiddenState(hidden, { type: 'showAll' })).toEqual({ rows: [], cols: [] })
    expect(nextHiddenState({ rows: [], cols: [] }, { type: 'showAll' })).toBeNull()
  })
})
