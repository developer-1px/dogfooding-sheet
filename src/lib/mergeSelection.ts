import { COL_LETTERS } from './a1'

export type Merge = readonly [number, number, number, number] // [rMin, rMax, cMin, cMax]

interface MergeOps {
  addMerge: (m: Merge) => void
  unmergeAt: (r: number, c: number) => void
}

export function mergeSelection(selectedIds: string[], focusId: string | null, ops: MergeOps): void {
  const ids = selectedIds.length > 0 ? selectedIds : (focusId ? [focusId] : [])
  if (ids.length === 0) return
  let rMin = Infinity, rMax = -1, cMin = Infinity, cMax = -1
  for (const id of ids) {
    const m = /^r(\d+)-([A-J])$/.exec(id); if (!m) continue
    const r = +m[1]; const c = COL_LETTERS.indexOf(m[2] as (typeof COL_LETTERS)[number])
    if (r < rMin) rMin = r; if (r > rMax) rMax = r
    if (c < cMin) cMin = c; if (c > cMax) cMax = c
  }
  if (rMin === rMax && cMin === cMax) ops.unmergeAt(rMin, cMin)
  else if (rMin === rMax) ops.addMerge([rMin, rMax, cMin, cMax] as const)
  else { console.warn('Multi-row merge not yet supported (CSS grid spans don\'t cross row containers)'); ops.addMerge([rMin, rMin, cMin, cMax] as const) }
}
