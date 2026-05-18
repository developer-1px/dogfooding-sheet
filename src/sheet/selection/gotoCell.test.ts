import { describe, it, expect } from 'vitest'
import { resolveCellRef, resolveRange } from './gotoCell'

const defaultBounds = { rowCount: 20, colCount: 10 }

describe('resolveCellRef', () => {
  it('valid A1-style addresses', () => {
    expect(resolveCellRef('A1')).toBe('r0-A')
    expect(resolveCellRef('B5')).toBe('r4-B')
    expect(resolveCellRef('j20')).toBe('r19-J')
  })
  it('invalid → null', () => {
    expect(resolveCellRef('Z5', defaultBounds)).toBeNull()
    expect(resolveCellRef('A21', defaultBounds)).toBeNull()
    expect(resolveCellRef('garbage')).toBeNull()
    expect(resolveCellRef('A0')).toBeNull()
  })
  it('trims whitespace', () => {
    expect(resolveCellRef(' B3 ')).toBe('r2-B')
  })
  it('supports expanded bounds', () => {
    expect(resolveCellRef('Z5', { rowCount: 50, colCount: 26 })).toBe('r4-Z')
  })
})

describe('resolveRange', () => {
  it('expands A1:B2 in row-major order', () => {
    expect(resolveRange('A1:B2')).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
  })
  it('normalizes reverse order', () => {
    expect(resolveRange('B2:A1')).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
  })
  it('null on bad input', () => {
    expect(resolveRange('A1')).toBeNull()
    expect(resolveRange('A1:Z5', defaultBounds)).toBeNull()
  })
})
