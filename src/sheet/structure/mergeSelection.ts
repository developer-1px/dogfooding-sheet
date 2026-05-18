import { mergeActionForSelection, type Merge } from '@spredsheet/grid'

export type { Merge } from '@spredsheet/grid'

interface MergeOps {
  addMerge: (m: Merge) => void
  unmergeAt: (r: number, c: number) => void
}

export function mergeSelection(selectedIds: string[], focusId: string | null, ops: MergeOps): void {
  const action = mergeActionForSelection(selectedIds, focusId)
  if (action.type === 'none') return
  if (action.type === 'unmerge') ops.unmergeAt(action.row, action.col)
  else {
    if (action.truncatedRows) console.warn('Multi-row merge not yet supported (CSS grid spans don\'t cross row containers)')
    ops.addMerge(action.merge)
  }
}
