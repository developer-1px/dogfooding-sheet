import { describe, it, expect } from 'vitest'
import { idsForCol, idsForRow, idsForAll } from './range'

describe('idsForCol', () => {
  it('returns row-major cell ids for a column', () => {
    expect(idsForCol('B', 3)).toEqual(['r0-B', 'r1-B', 'r2-B'])
  })
})

describe('idsForRow', () => {
  it('returns one id per visible column letter', () => {
    expect(idsForRow(2)).toEqual(['r2-A', 'r2-B', 'r2-C', 'r2-D', 'r2-E', 'r2-F', 'r2-G', 'r2-H', 'r2-I', 'r2-J'])
  })
})

describe('idsForAll', () => {
  it('produces rowCount × COL_LETTERS ids', () => {
    expect(idsForAll(2).length).toBe(20)
    expect(idsForAll(2)[0]).toBe('r0-A')
    expect(idsForAll(2)[19]).toBe('r1-J')
  })
})
