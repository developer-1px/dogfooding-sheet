import { describe, it, expect, vi } from 'vitest'
import { mergeSelection } from './mergeSelection'

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

  it('multi-row selection collapses to first row only (CSS grid limit)', () => {
    const ops = makeOps()
    mergeSelection(['r1-A', 'r1-B', 'r2-A', 'r2-B'], null, ops)
    expect(ops.addMerge).toHaveBeenCalledWith([1, 1, 0, 1])
  })

  it('empty selection + null focus → no-op', () => {
    const ops = makeOps()
    mergeSelection([], null, ops)
    expect(ops.addMerge).not.toHaveBeenCalled()
    expect(ops.unmergeAt).not.toHaveBeenCalled()
  })
})
