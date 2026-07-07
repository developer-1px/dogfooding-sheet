import { describe, it, expect, vi } from 'vitest'
import { canMergeSelection, mergeSelection } from './mergeSelection'

const makeOps = () => ({ addMerge: vi.fn(), unmergeAt: vi.fn() })

describe('mergeSelection', () => {
  it('multi-cell selection (row N) → addMerge with computed bounds', () => {
    const ops = makeOps()
    mergeSelection(['r0-A', 'r0-B', 'r0-C'], null, ops)
    expect(ops.addMerge).toHaveBeenCalledWith([0, 0, 0, 2])
    expect(ops.unmergeAt).not.toHaveBeenCalled()
  })

  it('single cell + focusId → unmergeAt', () => {
    const ops = makeOps()
    mergeSelection([], 'r3-B', ops)
    expect(ops.unmergeAt).toHaveBeenCalledWith(3, 1)
    expect(ops.addMerge).not.toHaveBeenCalled()
  })

  it('multi-row selection is ignored while cross-row merge is unsupported', () => {
    const ops = makeOps()
    mergeSelection(['r1-A', 'r1-B', 'r2-A', 'r2-B'], null, ops)
    expect(ops.addMerge).not.toHaveBeenCalled()
    expect(ops.unmergeAt).not.toHaveBeenCalled()
  })

  it('empty selection + null focus → no-op', () => {
    const ops = makeOps()
    mergeSelection([], null, ops)
    expect(ops.addMerge).not.toHaveBeenCalled()
    expect(ops.unmergeAt).not.toHaveBeenCalled()
  })
})

describe('canMergeSelection', () => {
  it('allows a supported multi-cell row merge', () => {
    expect(canMergeSelection(['r0-A', 'r0-B'], null, [])).toBe(true)
  })

  it('allows unmerge when the focused cell is inside an existing merge', () => {
    expect(canMergeSelection([], 'r2-C', [[2, 2, 1, 3]])).toBe(true)
  })

  it('blocks a single unmerged focused cell', () => {
    expect(canMergeSelection([], 'r2-C', [[0, 0, 0, 1]])).toBe(false)
  })

  it('blocks unsupported cross-row selections', () => {
    expect(canMergeSelection(['r1-A', 'r1-B', 'r2-A', 'r2-B'], null, [])).toBe(false)
  })
})
