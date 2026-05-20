import type { SheetOps } from '../schema'
import { addMergeToList, buildMergeMap, isValidMerge, normalizeMergeList, removeMergeAt, type Merge, type MergeBounds } from '@spredsheet/grid'

export { buildMergeMap }

export const sameMergeList = (a: ReadonlyArray<Merge>, b: ReadonlyArray<Merge>): boolean =>
  a.length === b.length && a.every((merge, index) =>
    merge[0] === b[index]?.[0] &&
    merge[1] === b[index]?.[1] &&
    merge[2] === b[index]?.[2] &&
    merge[3] === b[index]?.[3],
  )

export function useMerges(merges: ReadonlyArray<Merge>, ops: SheetOps, bounds?: MergeBounds) {
  const current = bounds ? normalizeMergeList(merges, bounds) : [...merges]

  const addMerge = (m: Merge) => {
    if (bounds && !isValidMerge(m, bounds)) return
    const next = bounds ? normalizeMergeList(addMergeToList(current, m), bounds) : addMergeToList(current, m)
    if (!sameMergeList(current, next)) ops.replace('/merges', next)
  }
  const unmergeAt = (r: number, c: number) => {
    if (bounds && (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= bounds.rowCount || c < 0 || c >= bounds.colCount)) return
    const next = removeMergeAt(current, r, c)
    if (next.length !== current.length) ops.replace('/merges', next)
  }
  return { addMerge, unmergeAt }
}
