import { describe, it, expect } from 'vitest'
import { hiddenRows } from './useFilter'

describe('hiddenRows', () => {
  const cells: Record<string, string> = { A1: 'Item', A2: 'Apple', A3: 'Bread', A4: 'Milk' }
  const display = (k: string) => cells[k] ?? ''

  it('returns empty when no filter', () => {
    expect(hiddenRows(null, 4, display).size).toBe(0)
  })

  it('hides non-matching rows but keeps header (row 0)', () => {
    const hidden = hiddenRows({ col: 'A', text: 'br' }, 4, display)
    expect(hidden.has(0)).toBe(false) // header
    expect(hidden.has(1)).toBe(true)  // Apple
    expect(hidden.has(2)).toBe(false) // Bread matches
    expect(hidden.has(3)).toBe(true)  // Milk
  })

  it('matches case-insensitively', () => {
    const hidden = hiddenRows({ col: 'A', text: 'apple' }, 4, display)
    expect(hidden.has(1)).toBe(false)
  })
})
