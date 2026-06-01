import type { SheetGridCell } from './gridTypes'
import { describe, expect, it } from 'vitest'
import { createGridCellViewModel, mergeRangeLabel } from './gridCellViewModel'

const cell = (id: string, label = '', selected = false): SheetGridCell => ({
  id,
  label,
  selected,
})

describe('mergeRangeLabel', () => {
  it('formats single and multi-cell merge ranges', () => {
    expect(mergeRangeLabel(0, 0, { rows: 1, cols: 1 }, ['A', 'B'])).toBe('A1')
    expect(mergeRangeLabel(1, 1, { rows: 2, cols: 2 }, ['A', 'B', 'C'])).toBe('B2:C3')
  })
})

describe('createGridCellViewModel', () => {
  it('skips hidden columns and hidden merge cells', () => {
    expect(createGridCellViewModel({
      rowIndex: 0,
      colIndex: 1,
      cell: cell('r0-B'),
      colLetters: ['A', 'B'],
      hiddenCols: new Set(['B']),
      mergeAnchors: new Map(),
      mergeHidden: new Set(),
      freezeCols: 0,
      freezeLefts: [],
      focusId: null,
      fillSourceRect: null,
      styleOf: () => undefined,
      noteOf: () => undefined,
      rawOf: () => undefined,
      ruleOf: () => undefined,
      condBgOf: () => undefined,
      highlightedIds: new Set(),
      previewIds: new Set(),
    })).toBeNull()

    expect(createGridCellViewModel({
      rowIndex: 0,
      colIndex: 0,
      cell: cell('r0-A'),
      colLetters: ['A'],
      hiddenCols: new Set(),
      mergeAnchors: new Map(),
      mergeHidden: new Set(['0,0']),
      freezeCols: 0,
      freezeLefts: [],
      focusId: null,
      fillSourceRect: null,
      styleOf: () => undefined,
      noteOf: () => undefined,
      rawOf: () => undefined,
      ruleOf: () => undefined,
      condBgOf: () => undefined,
      highlightedIds: new Set(),
      previewIds: new Set(),
    })).toBeNull()
  })

  it('derives display, style, merge, and validation metadata for a cell', () => {
    const view = createGridCellViewModel({
      rowIndex: 0,
      colIndex: 0,
      cell: cell('r0-A', '42', true),
      colLetters: ['A', 'B'],
      hiddenCols: new Set(),
      mergeAnchors: new Map([['0,0', { rows: 1, cols: 2 }]]),
      mergeHidden: new Set(),
      freezeCols: 1,
      freezeLefts: [48],
      focusId: 'r0-A',
      fillSourceRect: { rMin: 0, rMax: 0, cMin: 0, cMax: 0 },
      styleOf: () => ({ b: true, bg: '#fff' }),
      noteOf: () => 'note',
      rawOf: () => '=SUM(B1:B2)',
      ruleOf: () => ({ type: 'list', options: ['A', 'B'] }),
      condBgOf: () => '#eee',
      highlightedIds: new Set(['r0-A']),
      previewIds: new Set(['r0-A']),
    })

    expect(view).toMatchObject({
      address: 'A1',
      selected: true,
      focused: true,
      highlighted: true,
      numeric: true,
      mergeRange: 'A1:B1',
      mergeRows: 1,
      mergeCols: 2,
      styleClass: 'bold freeze-col',
      styleInline: { background: '#eee', left: 48, gridColumn: '2 / span 2', zIndex: 4 },
      note: 'note',
      tooltip: '=SUM(B1:B2)',
      validationOptions: ['A', 'B'],
      previewing: true,
    })
  })

  it('marks checkbox cells from validation rules', () => {
    const view = createGridCellViewModel({
      rowIndex: 0,
      colIndex: 0,
      cell: cell('r0-A', 'TRUE'),
      colLetters: ['A'],
      hiddenCols: new Set(),
      mergeAnchors: new Map(),
      mergeHidden: new Set(),
      freezeCols: 0,
      freezeLefts: [],
      focusId: null,
      fillSourceRect: null,
      styleOf: () => undefined,
      noteOf: () => undefined,
      rawOf: () => 'TRUE',
      ruleOf: () => ({ type: 'checkbox' }),
      condBgOf: () => undefined,
      highlightedIds: new Set(),
      previewIds: new Set(),
    })

    expect(view?.checkbox).toBe(true)
  })

  it('uses a precomputed fill source rect for fill-corner state', () => {
    const base = {
      rowIndex: 1,
      colIndex: 1,
      colLetters: ['A', 'B'],
      hiddenCols: new Set<string>(),
      mergeAnchors: new Map<string, never>(),
      mergeHidden: new Set<string>(),
      freezeCols: 0,
      freezeLefts: [],
      focusId: null,
      fillSourceRect: { rMin: 0, rMax: 1, cMin: 0, cMax: 1 },
      styleOf: () => undefined,
      noteOf: () => undefined,
      rawOf: () => undefined,
      ruleOf: () => undefined,
      condBgOf: () => undefined,
      highlightedIds: new Set<string>(),
      previewIds: new Set<string>(),
    }

    expect(createGridCellViewModel({ ...base, cell: cell('r1-B') })?.fillCorner).toBe(true)
    expect(createGridCellViewModel({ ...base, cell: cell('r1-A') })?.fillCorner).toBe(false)
  })
})
