import { describe, it, expect } from 'vitest'
import { rectFromIds, formatRect } from './rect'

describe('rectFromIds', () => {
  it('returns null for empty', () => {
    expect(rectFromIds([])).toBeNull()
  })
  it('computes bounding rect', () => {
    expect(rectFromIds(['r0-A', 'r2-C'])).toEqual({ rMin: 0, rMax: 2, cMin: 0, cMax: 2 })
  })
})

describe('formatRect', () => {
  it('single cell shows just A1', () => {
    expect(formatRect({ rMin: 0, rMax: 0, cMin: 0, cMax: 0 })).toBe('A1')
  })
  it('multi-cell shows A1:C3', () => {
    expect(formatRect({ rMin: 0, rMax: 2, cMin: 0, cMax: 2 })).toBe('A1:C3')
  })
})
