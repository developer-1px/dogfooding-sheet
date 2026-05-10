import { describe, it, expect } from 'vitest'
import { jumpToEdge } from './jumpEdge'

describe('jumpToEdge', () => {
  const cells = { A1: 'a', A2: 'b', A3: 'c', A5: 'd' } // gap at A4
  it('jumps down to last contiguous filled cell', () => {
    expect(jumpToEdge('r0-A', cells, 10, 'ArrowDown')).toBe('r2-A')
  })
  it('does not cross blank row', () => {
    expect(jumpToEdge('r0-A', cells, 10, 'ArrowDown')).toBe('r2-A')
  })
  it('stops at edge if next is empty', () => {
    expect(jumpToEdge('r0-A', { A1: 'x' }, 10, 'ArrowDown')).toBe('r0-A')
  })
})

import { idsBetween, homeEndTarget } from './jumpEdge'
describe('homeEndTarget', () => {
  it('Home goes to col A in same row', () => {
    expect(homeEndTarget('r3-E', 20, 'Home', false)).toBe('r3-A')
  })
  it('End goes to col J in same row', () => {
    expect(homeEndTarget('r3-E', 20, 'End', false)).toBe('r3-J')
  })
  it('Ctrl+Home = A1, Ctrl+End = J{last}', () => {
    expect(homeEndTarget('r3-E', 20, 'Home', true)).toBe('r0-A')
    expect(homeEndTarget('r3-E', 20, 'End', true)).toBe('r19-J')
  })
})

describe('idsBetween', () => {
  it('lists rectangle inclusive', () => {
    expect(idsBetween('r0-A', 'r1-B')).toEqual(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
  })
  it('handles reversed corners', () => {
    expect(idsBetween('r2-C', 'r0-A').length).toBe(9)
  })
})
