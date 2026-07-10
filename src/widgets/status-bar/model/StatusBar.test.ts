import { describe, expect, it } from 'vitest'
import { cellId, parseCellId } from '../../../entities/Sheet/schema'
import { statusBarViewModel } from './statusBarModel'

describe('statusBarViewModel', () => {
  it('keeps single-cell focus terse', () => {
    const model = statusBarViewModel({
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
    })

    expect(model).toEqual({
      summary: '1 셀',
      showDetails: false,
      nonEmpty: 0,
      numeric: null,
    })
  })

  it('aggregates larger numeric selections without argument spreading', () => {
    const rowCount = 150_000
    const selectedIds = Array.from({ length: rowCount }, (_unused, row) => cellId('A', row))

    const model = statusBarViewModel({
      selectedIds,
      focusId: null,
      rowCount,
      colCount: 1,
      display: (key) => key.slice(1),
      parseId: parseCellId,
    })

    expect(model.summary).toBe(`전체 시트 (${rowCount} 셀)`)
    expect(model.showDetails).toBe(true)
    expect(model.nonEmpty).toBe(rowCount)
    expect(model.numeric).toEqual({
      sum: rowCount * (rowCount + 1) / 2,
      avg: (rowCount + 1) / 2,
      min: 1,
      max: rowCount,
      count: rowCount,
      median: (rowCount + 1) / 2,
    })
  })
})
