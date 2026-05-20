import { describe, expect, it } from 'vitest'
import { MIN_WIDTH, storedColumnWidth } from './useColWidths'

describe('storedColumnWidth', () => {
  it('omits default and invalid widths from document state', () => {
    expect(storedColumnWidth(100)).toBeUndefined()
    expect(storedColumnWidth(Number.NaN)).toBeUndefined()
  })

  it('rounds and clamps custom widths before storing them', () => {
    expect(storedColumnWidth(120.6)).toBe(121)
    expect(storedColumnWidth(1)).toBe(MIN_WIDTH)
  })
})
