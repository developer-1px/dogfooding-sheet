import { describe, expect, it } from 'vitest'
import { coerceLegacyHidden, nextHiddenState, normalizeHiddenState, type HiddenState } from './useHidden'

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

  it('ignores hide requests outside sheet bounds', () => {
    const bounds = { rowCount: 2, colCount: 2 }
    expect(nextHiddenState(hidden, { type: 'hideRow', row: 2 }, bounds)).toBeNull()
    expect(nextHiddenState(hidden, { type: 'hideCol', col: 'C' }, bounds)).toBeNull()
  })
})

describe('normalizeHiddenState', () => {
  it('dedupes hidden rows and columns within bounds', () => {
    expect(normalizeHiddenState({
      rows: [2, 0, 0, 3, 1.5],
      cols: ['B', 'B', 'C', 'A'],
    }, { rowCount: 3, colCount: 2 })).toEqual({
      rows: [0, 2],
      cols: ['B', 'A'],
    })
  })
})

describe('coerceLegacyHidden', () => {
  it('returns undefined when no legacy hidden target survives', () => {
    expect(coerceLegacyHidden({ rows: [3], cols: ['C'] }, { rowCount: 2, colCount: 2 })).toBeUndefined()
    expect(coerceLegacyHidden(null)).toBeUndefined()
  })
})
