import { parseCellId, colIndex } from './a1'

export type Merge = [number, number, number, number] // [rMin, rMax, cMin, cMax]

interface MergeOps {
  addMerge: (m: Merge) => void
  unmergeAt: (r: number, c: number) => void
}

export function mergeSelection(selectedIds: string[], focusId: string | null, ops: MergeOps): void {
  const ids = selectedIds.length > 0 ? selectedIds : (focusId ? [focusId] : [])
  if (ids.length === 0) return
  let rMin = Infinity, rMax = -1, cMin = Infinity, cMax = -1
  for (const id of ids) {
    const p = parseCellId(id); if (!p) continue
    const r = p.row; const c = colIndex(p.col)
    if (r < rMin) rMin = r; if (r > rMax) rMax = r
    if (c < cMin) cMin = c; if (c > cMax) cMax = c
  }
  if (rMin === rMax && cMin === cMax) ops.unmergeAt(rMin, cMin)
  else if (rMin === rMax) ops.addMerge([rMin, rMax, cMin, cMax])
  else { console.warn('Multi-row merge not yet supported (CSS grid spans don\'t cross row containers)'); ops.addMerge([rMin, rMin, cMin, cMax]) }
}
