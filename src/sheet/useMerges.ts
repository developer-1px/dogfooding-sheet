import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import type { Merge } from '../lib/mergeSelection'
export type { Merge }

export interface MergeInfo { anchorR: number; anchorC: number; rows: number; cols: number }

const overlap = (a: Merge, b: Merge) => a[0] <= b[1] && a[1] >= b[0] && a[2] <= b[3] && a[3] >= b[2]

export function buildMergeMap(merges: ReadonlyArray<Merge>): {
  anchors: Map<string, MergeInfo>
  hidden: Set<string>
} {
  const anchors = new Map<string, MergeInfo>()
  const hidden = new Set<string>()
  for (const [rMin, rMax, cMin, cMax] of merges) {
    anchors.set(`${rMin},${cMin}`, { anchorR: rMin, anchorC: cMin, rows: rMax - rMin + 1, cols: cMax - cMin + 1 })
    for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) {
      if (r === rMin && c === cMin) continue
      hidden.add(`${r},${c}`)
    }
  }
  return { anchors, hidden }
}

export function useMerges(merges: ReadonlyArray<Merge>, ops: JsonOps<Sheet>) {
  const addMerge = (m: Merge) => {
    const next = merges.filter((e) => !overlap(e, m))
    ops.replace('/merges', [...next, m])
  }
  const unmergeAt = (r: number, c: number) => {
    const next = merges.filter((m) => !(m[0] <= r && m[1] >= r && m[2] <= c && m[3] >= c))
    if (next.length !== merges.length) ops.replace('/merges', next)
  }
  return { addMerge, unmergeAt }
}
