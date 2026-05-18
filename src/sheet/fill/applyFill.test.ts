import { describe, it, expect } from 'vitest'
import { applyFill } from './applyFill'

describe('applyFill', () => {
  it('extends arithmetic series downward', () => {
    const cells = { A1: '1', A2: '2' }
    const writes: Record<string, string> = {}
    applyFill(
      { rMin: 0, rMax: 1, cMin: 0, cMax: 0 },
      { rMin: 0, rMax: 4, cMin: 0, cMax: 0 },
      cells, (k, v) => { writes[k] = v },
    )
    expect(writes).toEqual({ A3: '3', A4: '4', A5: '5' })
  })
  it('cycles non-arithmetic source down', () => {
    const cells = { A1: 'foo', A2: 'bar' }
    const writes: Record<string, string> = {}
    applyFill(
      { rMin: 0, rMax: 1, cMin: 0, cMax: 0 },
      { rMin: 0, rMax: 5, cMin: 0, cMax: 0 },
      cells, (k, v) => { writes[k] = v },
    )
    expect(writes.A3).toBe('foo')
    expect(writes.A4).toBe('bar')
    expect(writes.A5).toBe('foo')
  })
  it('extends rightward across columns', () => {
    const cells = { A1: '10', B1: '20' }
    const writes: Record<string, string> = {}
    applyFill(
      { rMin: 0, rMax: 0, cMin: 0, cMax: 1 },
      { rMin: 0, rMax: 0, cMin: 0, cMax: 3 },
      cells, (k, v) => { writes[k] = v },
    )
    expect(writes.C1).toBe('30')
    expect(writes.D1).toBe('40')
  })
})
