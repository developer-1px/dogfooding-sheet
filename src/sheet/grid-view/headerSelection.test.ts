import { describe, expect, it } from 'vitest'
import { selectAllHeaders, selectColumnHeader, selectRowHeader } from './headerSelection'

describe('header selection', () => {
  it('selects the whole sheet from the corner header', () => {
    expect(selectAllHeaders(2, ['A', 'B'])).toEqual({
      focusId: 'r0-A',
      anchorId: 'r0-A',
      selectedIds: ['r0-A', 'r0-B', 'r1-A', 'r1-B'],
    })
  })

  it('selects one column without an anchor', () => {
    expect(selectColumnHeader('B', null, 2, ['A', 'B', 'C'])).toEqual({
      focusId: 'r0-B',
      anchorId: 'r0-B',
      selectedIds: ['r0-B', 'r1-B'],
    })
  })

  it('extends column selection across the anchor and target columns', () => {
    expect(selectColumnHeader('D', 'B', 2, ['A', 'B', 'C', 'D'])).toEqual({
      focusId: 'r0-D',
      anchorId: 'r0-D',
      selectedIds: ['r0-B', 'r1-B', 'r0-C', 'r1-C', 'r0-D', 'r1-D'],
    })
  })

  it('falls back to the target column when the column anchor is invalid', () => {
    expect(selectColumnHeader('B', 'Z', 2, ['A', 'B', 'C'])).toEqual({
      focusId: 'r0-B',
      anchorId: 'r0-B',
      selectedIds: ['r0-B', 'r1-B'],
    })
  })

  it('selects one row without an anchor', () => {
    expect(selectRowHeader(1, null, ['A', 'B'])).toEqual({
      focusId: 'r1-A',
      anchorId: 'r1-A',
      selectedIds: ['r1-A', 'r1-B'],
    })
  })

  it('extends row selection across the anchor and target rows', () => {
    expect(selectRowHeader(3, 'r1-A', ['A', 'B'])).toEqual({
      focusId: 'r3-A',
      anchorId: 'r3-A',
      selectedIds: ['r1-A', 'r1-B', 'r2-A', 'r2-B', 'r3-A', 'r3-B'],
    })
  })

  it('falls back to the target row when the row anchor is invalid', () => {
    expect(selectRowHeader(2, 'bad-anchor', ['A', 'B'])).toEqual({
      focusId: 'r2-A',
      anchorId: 'r2-A',
      selectedIds: ['r2-A', 'r2-B'],
    })
  })
})
