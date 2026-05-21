import { describe, expect, it } from 'vitest'
import {
  ariaGridSelectionSchema,
  clearSelectedIds,
  createAriaGridSelection,
  gridcellIdSchema,
  parseAriaGridSelection,
  replaceAriaGridSelection,
  selectAllGridcells,
  selectColumn,
  selectGridcell,
  selectGridcellRange,
  selectRow,
  setActiveDescendant,
  setSelectedIds,
  setSelectionAnchor,
  targetSelectedIds,
} from './index'

describe('@spredsheet/grid-contract aria grid selection', () => {
  it('validates WAI-ARIA gridcell ids', () => {
    expect(gridcellIdSchema.parse('r0-A')).toBe('r0-A')
    expect(gridcellIdSchema.parse('r12-AA')).toBe('r12-AA')
    expect(gridcellIdSchema.safeParse('A1').success).toBe(false)
    expect(gridcellIdSchema.safeParse('r01-A').success).toBe(false)
  })

  it('parses the stable ARIA-named selection contract as readonly data', () => {
    const parsed = parseAriaGridSelection({
      activeDescendantId: 'r1-B',
      selectionAnchorId: 'r0-A',
      selectedIds: ['r0-A', 'r1-B'],
    })

    expect(parsed).toEqual({
      activeDescendantId: 'r1-B',
      selectionAnchorId: 'r0-A',
      selectedIds: ['r0-A', 'r1-B'],
    })
    expect(Object.isFrozen(parsed)).toBe(true)
    expect(Object.isFrozen(parsed.selectedIds)).toBe(true)
  })

  it('rejects pre-contract focus and anchor field names', () => {
    expect(ariaGridSelectionSchema.safeParse({
      focusId: 'r0-A',
      anchorId: 'r0-A',
      selectedIds: [],
    }).success).toBe(false)
  })

  it('runs active descendant and selected id transitions immutably', () => {
    let selection = createAriaGridSelection('r0-A')
    selection = setSelectedIds(selection, ['r0-A', 'r0-B'])
    selection = setActiveDescendant(selection, 'r1-C', {
      selectionAnchorId: 'r1-C',
      clearSelection: true,
    })

    expect(selection).toEqual({
      activeDescendantId: 'r1-C',
      selectionAnchorId: 'r1-C',
      selectedIds: [],
    })
    expect(targetSelectedIds(selection)).toEqual(['r1-C'])

    selection = setSelectedIds(selection, (ids) => [...ids, 'r1-C'])
    expect(clearSelectedIds(selection)).toEqual({
      activeDescendantId: 'r1-C',
      selectionAnchorId: 'r1-C',
      selectedIds: [],
    })
  })

  it('selects gridcell, range, row, column, and all gridcells', () => {
    let selection = createAriaGridSelection('r0-A')

    selection = selectGridcell(selection, 'r1-B')
    expect(selection).toEqual({
      activeDescendantId: 'r1-B',
      selectionAnchorId: 'r1-B',
      selectedIds: ['r1-B'],
    })

    selection = selectGridcellRange(selection, 'r2-C', 'r1-B')
    expect(selection).toEqual({
      activeDescendantId: 'r2-C',
      selectionAnchorId: 'r1-B',
      selectedIds: ['r1-B', 'r1-C', 'r2-B', 'r2-C'],
    })

    expect(selectColumn(selection, 'B', { rowCount: 3 })).toEqual({
      activeDescendantId: 'r0-B',
      selectionAnchorId: 'r0-B',
      selectedIds: ['r0-B', 'r1-B', 'r2-B'],
    })

    expect(selectRow(selection, 1, { colLetters: ['A', 'B', 'C'] })).toEqual({
      activeDescendantId: 'r1-A',
      selectionAnchorId: 'r1-A',
      selectedIds: ['r1-A', 'r1-B', 'r1-C'],
    })

    expect(selectAllGridcells(selection, { rowCount: 2, colLetters: ['A', 'B'] })).toEqual({
      activeDescendantId: 'r0-A',
      selectionAnchorId: 'r0-A',
      selectedIds: ['r0-A', 'r0-B', 'r1-A', 'r1-B'],
    })
  })

  it('replaces selection while preserving omitted active descendant and anchor fields', () => {
    const selection = setSelectionAnchor(
      setActiveDescendant(createAriaGridSelection('r0-A'), 'r1-B'),
      'r0-A',
    )

    expect(replaceAriaGridSelection(selection, ['r2-C'])).toEqual({
      activeDescendantId: 'r1-B',
      selectionAnchorId: 'r0-A',
      selectedIds: ['r2-C'],
    })
  })
})
