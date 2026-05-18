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

  it('supports numeric comparison criteria with formatted values', () => {
    const values: Record<string, string> = { A1: 'Amount', A2: '$9.50', A3: '1,234', A4: '50%' }
    const hidden = hiddenRows({ col: 'A', text: '>10' }, 4, (k) => values[k] ?? '')
    expect(hidden.has(1)).toBe(true)
    expect(hidden.has(2)).toBe(false)
    expect(hidden.has(3)).toBe(true)
  })

  it('supports equality, inequality, and wildcard criteria', () => {
    expect(hiddenRows({ col: 'A', text: '=Bread' }, 4, display).has(2)).toBe(false)
    expect(hiddenRows({ col: 'A', text: '<>Bread' }, 4, display).has(2)).toBe(true)
    expect(hiddenRows({ col: 'A', text: 'B*' }, 4, display).has(2)).toBe(false)
  })
})
