import { describe, it, expect } from 'vitest'
import { fillDown, fillRight } from './fillDown'

describe('fillDown', () => {
  it('copies top-row cell down within each column', () => {
    const cells = { A1: 'x', A2: '', A3: '', B1: 'y', B2: '', B3: '' }
    const writes: Record<string, string> = {}
    fillDown(['r0-A', 'r1-A', 'r2-A', 'r0-B', 'r1-B', 'r2-B'], cells, (k, v) => { writes[k] = v })
    expect(writes).toEqual({ A2: 'x', A3: 'x', B2: 'y', B3: 'y' })
  })
  it('no-op for single-cell selection', () => {
    const writes: Record<string, string> = {}
    fillDown(['r0-A'], { A1: 'x' }, (k, v) => { writes[k] = v })
    expect(writes).toEqual({})
  })
  it('fillRight copies left column rightward per row', () => {
    const cells = { A1: 'x', B1: '', C1: '', A2: 'y', B2: '', C2: '' }
    const writes: Record<string, string> = {}
    fillRight(['r0-A', 'r0-B', 'r0-C', 'r1-A', 'r1-B', 'r1-C'], cells, (k, v) => { writes[k] = v })
    expect(writes).toEqual({ B1: 'x', C1: 'x', B2: 'y', C2: 'y' })
  })

  it('reports write failures without throwing', () => {
    expect(fillDown(['r0-A', 'r1-A'], { A1: 'x' }, () => { throw new Error('blocked') })).toBe(false)
    expect(fillRight(['r0-A', 'r0-B'], { A1: 'x' }, () => {}, () => { throw new Error('blocked') })).toBe(false)
  })
})
