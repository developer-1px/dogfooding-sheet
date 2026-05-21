import { describe, expect, it } from 'vitest'
import {
  clearSelection,
  createSelectionBoundary,
  createSelectionState,
  parseSelectionBoundary,
  parseSelectionState,
  replaceSelection,
  selectableIdSchema,
  selectionBoundarySchema,
  selectionStateSchema,
  setSelected,
  setSelectedIds,
  setSelectionAnchor,
  setSelectionFocus,
  toggleSelected,
} from './index'

describe('@spredsheet/selection-contract', () => {
  it('validates selectable descendant ids without prescribing an id format', () => {
    expect(selectableIdSchema.parse('r0-A')).toBe('r0-A')
    expect(selectableIdSchema.parse('option:open')).toBe('option:open')
    expect(selectableIdSchema.safeParse('').success).toBe(false)
  })

  it('parses selected ids and multiselectable state as readonly data', () => {
    const state = parseSelectionState({
      selectedIds: ['a'],
      multiselectable: false,
    })

    expect(state).toEqual({ selectedIds: ['a'], multiselectable: false })
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.selectedIds)).toBe(true)
  })

  it('defaults to single-selection and rejects multiple selected ids there', () => {
    expect(parseSelectionState({ selectedIds: [] })).toEqual({
      selectedIds: [],
      multiselectable: false,
    })

    expect(selectionStateSchema.safeParse({
      selectedIds: ['a', 'b'],
      multiselectable: false,
    }).success).toBe(false)
  })

  it('allows multiple selected ids when multiselectable is true', () => {
    expect(parseSelectionState({
      selectedIds: ['a', 'b'],
      multiselectable: true,
    })).toEqual({
      selectedIds: ['a', 'b'],
      multiselectable: true,
    })
  })

  it('parses anchor and focus boundaries with W3C Selection API names', () => {
    const boundary = parseSelectionBoundary({ anchorId: 'a', focusId: 'b' })

    expect(boundary).toEqual({ anchorId: 'a', focusId: 'b' })
    expect(Object.isFrozen(boundary)).toBe(true)
    expect(selectionBoundarySchema.safeParse({ activeId: 'a', anchorId: 'a' }).success).toBe(false)
  })

  it('runs single-selection transitions', () => {
    let state = createSelectionState({ selectedIds: ['a', 'b'] })
    expect(state).toEqual({ selectedIds: ['a'], multiselectable: false })

    state = setSelected(state, 'b', true)
    expect(state).toEqual({ selectedIds: ['b'], multiselectable: false })

    state = toggleSelected(state, 'b')
    expect(state).toEqual({ selectedIds: [], multiselectable: false })
  })

  it('runs multiple-selection transitions', () => {
    let state = createSelectionState({ multiselectable: true })
    state = setSelected(state, 'a', true)
    state = toggleSelected(state, 'b')
    state = setSelectedIds(state, (selectedIds) => [...selectedIds, 'c'])

    expect(state).toEqual({ selectedIds: ['a', 'b', 'c'], multiselectable: true })
    expect(replaceSelection(state, ['x', 'y'])).toEqual({ selectedIds: ['x', 'y'], multiselectable: true })
    expect(clearSelection(state)).toEqual({ selectedIds: [], multiselectable: true })
  })

  it('runs anchor and focus boundary transitions independently from selected ids', () => {
    let boundary = createSelectionBoundary('a')
    boundary = setSelectionFocus(boundary, 'b')
    boundary = setSelectionAnchor(boundary, 'a')

    expect(boundary).toEqual({ anchorId: 'a', focusId: 'b' })
    expect(setSelectionFocus(boundary, 'c', { anchorId: 'c' })).toEqual({ anchorId: 'c', focusId: 'c' })
  })
})
