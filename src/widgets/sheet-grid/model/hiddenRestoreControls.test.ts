import { describe, expect, it } from 'vitest'
import { columnRestoreControls, rowRestoreControls } from './hiddenRestoreControls'

describe('hidden restore controls', () => {
  it('describes adjacent hidden columns around a visible column', () => {
    expect(columnRestoreControls('B', ['A', 'B', 'C'], new Set(['A', 'C']))).toEqual([
      { col: 'A', className: 'unhide-col left', marker: '‹', label: 'A열 숨김 표시' },
      { col: 'C', className: 'unhide-col right', marker: '›', label: 'C열 숨김 표시' },
    ])
  })

  it('omits non-adjacent and missing hidden columns', () => {
    expect(columnRestoreControls('A', ['A', 'B', 'C'], new Set(['C']))).toEqual([])
  })

  it('describes adjacent hidden rows around a visible row', () => {
    expect(rowRestoreControls(2, new Set([1, 3]))).toEqual([
      { row: 1, className: 'unhide-row top', marker: '⌃', label: '2행 숨김 표시' },
      { row: 3, className: 'unhide-row bottom', marker: '⌄', label: '4행 숨김 표시' },
    ])
  })

  it('omits rows that are not adjacent', () => {
    expect(rowRestoreControls(2, new Set([0, 4]))).toEqual([])
  })
})
