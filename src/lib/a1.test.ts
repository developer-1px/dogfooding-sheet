import { describe, it, expect } from 'vitest'
import { cellKey, parseCellId, parseA1, colIndex, COL_LETTERS } from './a1'

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
  })
  it('returns null for malformed input', () => {
    expect(parseCellId('A1')).toBeNull()
    expect(parseCellId('r0-Z')).toBeNull()
    expect(parseCellId('garbage')).toBeNull()
  })
})

describe('parseA1', () => {
  it('parses A1-style key', () => {
    expect(parseA1('B3')).toEqual({ col: 'B', row: 2 })
  })
  it('rejects non-A1 input', () => {
    expect(parseA1('r0-A')).toBeNull()
    expect(parseA1('Z9')).toBeNull()
  })
})

describe('colIndex', () => {
  it('returns 0-based index of known letter', () => {
    expect(colIndex('A')).toBe(0)
    expect(colIndex('J')).toBe(9)
  })
  it('returns -1 for unknown letter', () => {
    expect(colIndex('Z')).toBe(-1)
  })
})

describe('COL_LETTERS', () => {
  it('has 10 entries A..J', () => {
    expect(COL_LETTERS.length).toBe(10)
    expect(COL_LETTERS[0]).toBe('A')
    expect(COL_LETTERS[9]).toBe('J')
  })
})
