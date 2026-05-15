import { describe, it, expect } from 'vitest'
import { idsForCol, idsForRow, idsForAll } from './range'

describe('idsForCol', () => {
  it('returns row-major cell ids for a column', () => {
    expect(idsForCol('B', 3)).toEqual(['r0-B', 'r1-B', 'r2-B'])
  })
})

describe('idsForRow', () => {
  it('returns one id per visible column letter', () => {
    expect(idsForRow(2, ['A', 'B', 'C'])).toEqual(['r2-A', 'r2-B', 'r2-C'])
  })
})

describe('idsForAll', () => {
  it('produces rowCount × visible columns ids', () => {
    expect(idsForAll(2, ['A', 'B']).length).toBe(4)
    expect(idsForAll(2)[0]).toBe('r0-A')
    expect(idsForAll(2, ['A', 'B'])[3]).toBe('r1-B')
  })
})
