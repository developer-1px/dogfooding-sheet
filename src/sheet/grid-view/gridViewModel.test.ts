import { describe, expect, it } from 'vitest'
import { createGridViewModel } from './gridViewModel'

describe('createGridViewModel', () => {
  it('derives focused and selected header state from grid cell ids', () => {
    const model = createGridViewModel({
      focusId: 'r1-B',
      selectedIds: ['r0-A', 'r1-B', 'bad-id'],
      rowCount: 3,
      colLetters: ['A', 'B', 'C'],
      hiddenCols: new Set<string>(),
    })

    expect(model.focusCol).toBe('B')
    expect(model.focusRow).toBe(1)
    expect([...model.selectedCols]).toEqual(['A', 'B'])
    expect([...model.selectedRows]).toEqual([0, 1])
    expect(model.allSelected).toBe(false)
  })

  it('keeps hidden columns out of the rendered column list', () => {
    const model = createGridViewModel({
      focusId: null,
      selectedIds: [],
      rowCount: 2,
      colLetters: ['A', 'B', 'C'],
      hiddenCols: new Set(['B']),
    })

    expect(model.visibleCols).toEqual(['A', 'C'])
  })

  it('marks the corner header selected when every grid cell is selected', () => {
    const model = createGridViewModel({
      focusId: null,
      selectedIds: ['r0-A', 'r0-B', 'r1-A', 'r1-B'],
      rowCount: 2,
      colLetters: ['A', 'B'],
      hiddenCols: new Set<string>(),
    })

    expect(model.allSelected).toBe(true)
  })
})
