import { describe, it, expect } from 'vitest'
import { rectToTsv, pasteTsv } from './clipboard'

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
