import { describe, it, expect } from 'vitest'
import { rectFromIds, rectToTsv, pasteTsv, formatRect } from './clipboard'

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

describe('rectToTsv / pasteTsv roundtrip', () => {
  it('serializes rect to tab-separated rows', () => {
    const cells: Record<string, string> = { A1: 'a', B1: 'b', A2: '1', B2: '2' }
    const tsv = rectToTsv({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, (k) => cells[k] ?? '')
    expect(tsv).toBe('a\tb\n1\t2')
  })
  it('paste writes cells anchored at target', () => {
    const written: Record<string, string> = {}
    pasteTsv('x\ty\n1\t2', { col: 'B', row: 1 }, (k, v) => { written[k] = v })
    expect(written).toEqual({ B2: 'x', C2: 'y', B3: '1', C3: '2' })
  })
})
