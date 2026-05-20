import type { SheetOps } from '../schema'
import { addMergeToList, buildMergeMap, isValidMerge, normalizeMergeList, removeMergeAt, type Merge, type MergeBounds } from '@spredsheet/grid'

export { buildMergeMap }

export function useMerges(merges: ReadonlyArray<Merge>, ops: SheetOps, bounds?: MergeBounds) {
  const current = bounds ? normalizeMergeList(merges, bounds) : [...merges]

  const addMerge = (m: Merge) => {
    if (bounds && !isValidMerge(m, bounds)) return
    ops.replace('/merges', bounds ? normalizeMergeList(addMergeToList(current, m), bounds) : addMergeToList(current, m))
  }
  const unmergeAt = (r: number, c: number) => {
    if (bounds && (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= bounds.rowCount || c < 0 || c >= bounds.colCount)) return
    const next = removeMergeAt(current, r, c)
    if (next.length !== current.length) ops.replace('/merges', next)
  }
  return { addMerge, unmergeAt }
}
