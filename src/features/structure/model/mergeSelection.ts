import { mergeActionForSelection, type Merge } from '@spredsheet/grid'

export type { Merge } from '@spredsheet/grid'

interface MergeOps {
  addMerge: (m: Merge) => void
  unmergeAt: (r: number, c: number) => void
}

const mergeContainsCell = (merge: Merge, row: number, col: number): boolean =>
  merge[0] <= row && merge[1] >= row && merge[2] <= col && merge[3] >= col

export function canMergeSelection(selectedIds: string[], focusId: string | null, merges: ReadonlyArray<Merge>): boolean {
  const action = mergeActionForSelection(selectedIds, focusId)
  if (action.type === 'none') return false
  if (action.type === 'merge') return true
  return merges.some((merge) => mergeContainsCell(merge, action.row, action.col))
}

export function mergeSelection(selectedIds: string[], focusId: string | null, ops: MergeOps): void {
  const action = mergeActionForSelection(selectedIds, focusId)
  if (action.type === 'none') return
  if (action.type === 'unmerge') ops.unmergeAt(action.row, action.col)
  else ops.addMerge(action.merge)
}
