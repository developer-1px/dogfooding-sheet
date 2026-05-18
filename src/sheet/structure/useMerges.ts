import type { SheetOps } from '../schema'
import { addMergeToList, buildMergeMap, removeMergeAt, type Merge } from '@spredsheet/grid'

export { buildMergeMap }

export function useMerges(merges: ReadonlyArray<Merge>, ops: SheetOps) {
  const addMerge = (m: Merge) => {
    ops.replace('/merges', addMergeToList(merges, m))
  }
  const unmergeAt = (r: number, c: number) => {
    const next = removeMergeAt(merges, r, c)
    if (next.length !== merges.length) ops.replace('/merges', next)
  }
  return { addMerge, unmergeAt }
}
