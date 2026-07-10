import { describe, it, expect, vi } from 'vitest'
import type { SheetOps } from '../../../entities/Sheet/schema'
import { buildMergeMap, useMerges, type MergeMutationCommands } from './useMerges'

const makeOps = () => {
  const replace = vi.fn()
  return { replace } as unknown as SheetOps & { replace: typeof replace }
}

const makeCommands = (result = true) => ({
  addMerge: vi.fn(() => result),
  removeMerge: vi.fn(() => result),
}) satisfies MergeMutationCommands

describe('buildMergeMap', () => {
  it('empty merges → empty maps', () => {
    const { anchors, hidden } = buildMergeMap([])
    expect(anchors.size).toBe(0)
    expect(hidden.size).toBe(0)
  })

  it('A1:C1 → 1 anchor at (0,0), 2 hidden cells', () => {
    const { anchors, hidden } = buildMergeMap([[0, 0, 0, 2]])
    expect(anchors.get('0,0')).toEqual({ anchorR: 0, anchorC: 0, rows: 1, cols: 3 })
    expect(hidden.has('0,1')).toBe(true)
    expect(hidden.has('0,2')).toBe(true)
    expect(hidden.has('0,0')).toBe(false)
  })

  it('B2:C3 → anchor at (1,1) with rows=2, cols=2; 3 hidden cells', () => {
    const { anchors, hidden } = buildMergeMap([[1, 2, 1, 2]])
    expect(anchors.get('1,1')).toEqual({ anchorR: 1, anchorC: 1, rows: 2, cols: 2 })
    expect(hidden.size).toBe(3)
    expect(hidden.has('1,2')).toBe(true)
    expect(hidden.has('2,1')).toBe(true)
    expect(hidden.has('2,2')).toBe(true)
  })

  it('multiple merges coexist independently', () => {
    const { anchors, hidden } = buildMergeMap([[0, 0, 0, 1], [3, 3, 3, 4]])
    expect(anchors.size).toBe(2)
    expect(hidden.has('0,1')).toBe(true)
    expect(hidden.has('3,4')).toBe(true)
  })

  it('adds merges through bounded normalized state', () => {
    const ops = makeOps()
    const commands = makeCommands()
    const actions = useMerges([[0, 0, 0, 1], [1, 1, 1, 1]], ops, { rowCount: 2, colCount: 3 }, commands)

    actions.addMerge([0, 0, 1, 2])

    expect(commands.addMerge).not.toHaveBeenCalled()
    expect(ops.replace).toHaveBeenCalledWith('/merges', [[0, 0, 1, 2]])
  })

  it('delegates a non-overlapping merge append', () => {
    const ops = makeOps()
    const commands = makeCommands()
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 }, commands)

    actions.addMerge([1, 1, 0, 1])

    expect(commands.addMerge).toHaveBeenCalledWith([1, 1, 0, 1])
    expect(ops.replace).not.toHaveBeenCalled()
  })

  it('falls back to replacing the merge list when append delegation fails', () => {
    const ops = makeOps()
    const commands = makeCommands(false)
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 }, commands)

    actions.addMerge([1, 1, 0, 1])

    expect(commands.addMerge).toHaveBeenCalledWith([1, 1, 0, 1])
    expect(ops.replace).toHaveBeenCalledWith('/merges', [[0, 0, 0, 1], [1, 1, 0, 1]])
  })

  it('keeps overlapping merge adds as whole-list replacements', () => {
    const ops = makeOps()
    const commands = makeCommands()
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 3 }, commands)

    actions.addMerge([0, 0, 1, 2])

    expect(commands.addMerge).not.toHaveBeenCalled()
    expect(ops.replace).toHaveBeenCalledWith('/merges', [[0, 0, 1, 2]])
  })

  it('skips adding a merge when the normalized merge list is unchanged', () => {
    const ops = makeOps()
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 })

    actions.addMerge([0, 0, 0, 1])

    expect(ops.replace).not.toHaveBeenCalled()
  })

  it('ignores add and unmerge requests outside bounds', () => {
    const ops = makeOps()
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 })

    actions.addMerge([0, 0, 1, 2])
    actions.unmergeAt(2, 0)

    expect(ops.replace).not.toHaveBeenCalled()
  })

  it('unmerges only when a bounded target hits an existing merge', () => {
    const ops = makeOps()
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 })

    actions.unmergeAt(0, 1)

    expect(ops.replace).toHaveBeenCalledWith('/merges', [])
  })

  it('delegates removing a single merge by index', () => {
    const ops = makeOps()
    const commands = makeCommands()
    const actions = useMerges([[0, 0, 0, 1], [1, 1, 0, 1]], ops, { rowCount: 2, colCount: 2 }, commands)

    actions.unmergeAt(1, 1)

    expect(commands.removeMerge).toHaveBeenCalledWith(1)
    expect(ops.replace).not.toHaveBeenCalled()
  })

  it('falls back to replacing the merge list when remove delegation fails', () => {
    const ops = makeOps()
    const commands = makeCommands(false)
    const actions = useMerges([[0, 0, 0, 1]], ops, { rowCount: 2, colCount: 2 }, commands)

    actions.unmergeAt(0, 1)

    expect(commands.removeMerge).toHaveBeenCalledWith(0)
    expect(ops.replace).toHaveBeenCalledWith('/merges', [])
  })
})
