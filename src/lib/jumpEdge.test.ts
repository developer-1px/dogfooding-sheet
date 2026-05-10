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
