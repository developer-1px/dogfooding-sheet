import { describe, it, expect } from 'vitest'
import { cellKey, parseCellId, parseA1, colIndex, COL_LETTERS, cellIdToKey } from './a1'

describe('cellKey', () => {
  it('combines col letter with 1-based row', () => {
    expect(cellKey('A', 0)).toBe('A1')
    expect(cellKey('C', 5)).toBe('C6')
  })
})

describe('parseCellId', () => {
  it('parses "r{n}-{C}" form', () => {
    expect(parseCellId('r0-A')).toEqual({ row: 0, col: 'A' })
    expect(parseCellId('r12-J')).toEqual({ row: 12, col: 'J' })
    expect(parseCellId('r12-Z')).toEqual({ row: 12, col: 'Z' })
  })
  it('returns null for malformed input', () => {
    expect(parseCellId('A1')).toBeNull()
    expect(parseCellId('r0-AA')).toBeNull()
    expect(parseCellId('garbage')).toBeNull()
  })
})

describe('parseA1', () => {
  it('parses A1-style key', () => {
    expect(parseA1('B3')).toEqual({ col: 'B', row: 2 })
  })
  it('rejects non-A1 input', () => {
    expect(parseA1('r0-A')).toBeNull()
    expect(parseA1('AA9')).toBeNull()
  })
})

describe('colIndex', () => {
  it('returns 0-based index of known letter', () => {
    expect(colIndex('A')).toBe(0)
    expect(colIndex('J')).toBe(9)
    expect(colIndex('Z')).toBe(25)
  })
  it('returns -1 for unknown letter', () => {
    expect(colIndex('AA')).toBe(-1)
  })
})

describe('cellIdToKey', () => {
  it('converts r{n}-{C} → A1 key', () => {
    expect(cellIdToKey('r0-A')).toBe('A1')
    expect(cellIdToKey('r12-J')).toBe('J13')
  })
  it('falls back to input on mismatch', () => {
    expect(cellIdToKey('A1')).toBe('A1')
  })
})

describe('COL_LETTERS', () => {
  it('has 26 entries A..Z', () => {
    expect(COL_LETTERS.length).toBe(26)
    expect(COL_LETTERS[0]).toBe('A')
    expect(COL_LETTERS[25]).toBe('Z')
  })
})
