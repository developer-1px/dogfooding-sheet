import { describe, it, expect } from 'vitest'
import { autoSumFormula } from './autoSum'

const make = (data: Record<string, string>) => (k: string) => data[k] ?? ''

describe('autoSumFormula', () => {
  it('returns SUM of contiguous numeric range above', () => {
    const display = make({ A1: '10', A2: '20', A3: '30' })
    expect(autoSumFormula('A', 3, display)).toBe('=SUM(A1:A3)')
  })
  it('stops at non-numeric row', () => {
    const display = make({ A1: 'header', A2: '5', A3: '7' })
    expect(autoSumFormula('A', 3, display)).toBe('=SUM(A2:A3)')
  })
  it('null when no numeric range above', () => {
    const display = make({ A1: 'x' })
    expect(autoSumFormula('A', 1, display)).toBeNull()
  })
  it('falls back to leftward run when nothing above', () => {
    const display = make({ A1: 'header', B1: '5', C1: '7' })
    expect(autoSumFormula('D', 0, display)).toBe('=SUM(B1:C1)')
  })
  it('handles formatted currency strings as numeric', () => {
    const display = make({ A1: '$1.50', A2: '$2.25' })
    expect(autoSumFormula('A', 2, display)).toBe('=SUM(A1:A2)')
  })
})
