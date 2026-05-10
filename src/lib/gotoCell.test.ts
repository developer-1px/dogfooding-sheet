import { describe, it, expect } from 'vitest'
import { resolveCellRef } from './gotoCell'

describe('resolveCellRef', () => {
  it('valid A1-style addresses', () => {
    expect(resolveCellRef('A1')).toBe('r0-A')
    expect(resolveCellRef('B5')).toBe('r4-B')
    expect(resolveCellRef('j20')).toBe('r19-J')
  })
  it('invalid → null', () => {
    expect(resolveCellRef('Z5')).toBeNull()
    expect(resolveCellRef('A21')).toBeNull()
    expect(resolveCellRef('garbage')).toBeNull()
    expect(resolveCellRef('A0')).toBeNull()
  })
  it('trims whitespace', () => {
    expect(resolveCellRef(' B3 ')).toBe('r2-B')
  })
})
