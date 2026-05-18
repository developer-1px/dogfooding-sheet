import { describe, expect, it } from 'vitest'
import { cellId, cellKey, deleteRow, insertRow, rectFromIds, rectToTsv, sortByColumn, writesFromTsv } from './index'

describe('@spredsheet/grid', () => {
  it('keeps A1 keys and DOM ids as pure coordinate transforms', () => {
    expect(cellKey('B', 2)).toBe('B3')
    expect(cellId('C', 4)).toBe('r4-C')
    expect(rectFromIds(['r1-B', 'r3-D'])).toEqual({ rMin: 1, rMax: 3, cMin: 1, cMax: 3 })
  })

  it('shifts row data and row references', () => {
    expect(insertRow({ A1: '1', A2: '=A1', A3: '=A2' }, 1, 4)).toEqual({
      A1: '1',
      A3: '=A1',
      A4: '=A3',
    })
    expect(deleteRow({ A1: '1', A2: '=A1', A3: '=A2' }, 1)).toEqual({
      A1: '1',
      A2: '=#REF!',
    })
  })

  it('converts TSV without touching the system clipboard', () => {
    const cells = { A1: 'name', B1: 'score', A2: 'Kim', B2: '10' }
    expect(rectToTsv({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 }, (k) => cells[k] ?? '')).toBe('name\tscore\nKim\t10')
    expect(writesFromTsv('A\tB\nC\tD', { col: 'B', row: 1 }, { maxRow: 3, maxCol: 3 })).toEqual([
      ['B2', 'A'],
      ['C2', 'B'],
      ['B3', 'C'],
      ['C3', 'D'],
    ])
  })

  it('sorts grid rows by a column while preserving outside rows', () => {
    expect(sortByColumn({ A1: 'name', A2: 'B', B2: '2', A3: 'A', B3: '1' }, { col: 'B', dir: 'asc', rowCount: 3 })).toEqual({
      A1: 'name',
      A2: 'A',
      B2: '1',
      A3: 'B',
      B3: '2',
    })
  })
})
