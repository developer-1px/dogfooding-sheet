import { describe, it, expect } from 'vitest'
import { fillDown } from './fillDown'

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
})
