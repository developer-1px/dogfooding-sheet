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
})
