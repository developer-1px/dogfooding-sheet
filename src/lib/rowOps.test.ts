import { describe, it, expect } from 'vitest'
import { insertRow, deleteRow } from './rowOps'

const RC = 20

describe('insertRow', () => {
  it('shifts cells at and after target row down', () => {
    const out = insertRow({ A1: 'a', A2: 'b', A3: 'c' }, 1, RC)
    expect(out).toEqual({ A1: 'a', A3: 'b', A4: 'c' })
  })

  it('rewrites formula refs when row shifts', () => {
    const out = insertRow({ A1: '1', A2: '2', B1: '=A2+1' }, 1, RC)
    expect(out.B1).toBe('=A3+1')
  })

  it('does not shift refs to rows above insert point', () => {
    const out = insertRow({ A1: '1', B5: '=A1+10' }, 2, RC)
    expect(out.B6).toBe('=A1+10')
  })
})

describe('deleteRow', () => {
  it('removes target row and shifts subsequent rows up', () => {
    const out = deleteRow({ A1: 'a', A2: 'b', A3: 'c' }, 1)
    expect(out).toEqual({ A1: 'a', A2: 'c' })
  })

  it('refs to deleted row become #REF!', () => {
    const out = deleteRow({ A1: '1', A2: '2', B1: '=A2+10' }, 1)
    expect(out.B1).toBe('=#REF!+10')
  })

  it('refs below deleted row shift up by 1', () => {
    const out = deleteRow({ A2: 'x', A3: '=A2+5' }, 0)
    expect(out.A2).toBe('=A1+5')
  })
})
