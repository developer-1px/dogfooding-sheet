import { colIndex, parseCellId } from '../coordinates/a1'

export type Merge = [number, number, number, number]

export interface MergeInfo {
  anchorR: number
  anchorC: number
  rows: number
  cols: number
}

export type MergeSelectionAction =
  | { type: 'none' }
  | { type: 'unmerge'; row: number; col: number }
  | { type: 'merge'; merge: Merge }

export const mergeOverlap = (a: Merge, b: Merge): boolean =>
  a[0] <= b[1] && a[1] >= b[0] && a[2] <= b[3] && a[3] >= b[2]

export function mergeActionForSelection(selectedIds: string[], focusId: string | null): MergeSelectionAction {
  const ids = selectedIds.length > 0 ? selectedIds : (focusId ? [focusId] : [])
  if (ids.length === 0) return { type: 'none' }

  let rMin = Infinity
  let rMax = -1
  let cMin = Infinity
  let cMax = -1
  for (const id of ids) {
    const p = parseCellId(id)
    if (!p) continue
    const r = p.row
    const c = colIndex(p.col)
    if (r < rMin) rMin = r
    if (r > rMax) rMax = r
    if (c < cMin) cMin = c
    if (c > cMax) cMax = c
  }

  if (!Number.isFinite(rMin) || cMin < 0) return { type: 'none' }
  if (rMin === rMax && cMin === cMax) return { type: 'unmerge', row: rMin, col: cMin }
  if (rMin === rMax) return { type: 'merge', merge: [rMin, rMax, cMin, cMax] }
  return { type: 'none' }
}

export function addMergeToList(merges: ReadonlyArray<Merge>, merge: Merge): Merge[] {
  return [...merges.filter((entry) => !mergeOverlap(entry, merge)), merge]
}

export function removeMergeAt(merges: ReadonlyArray<Merge>, row: number, col: number): Merge[] {
  return merges.filter((m) => !(m[0] <= row && m[1] >= row && m[2] <= col && m[3] >= col))
}

export function buildMergeMap(merges: ReadonlyArray<Merge>): {
  anchors: Map<string, MergeInfo>
  hidden: Set<string>
} {
  const anchors = new Map<string, MergeInfo>()
  const hidden = new Set<string>()
  for (const [rMin, rMax, cMin, cMax] of merges) {
    anchors.set(`${rMin},${cMin}`, { anchorR: rMin, anchorC: cMin, rows: rMax - rMin + 1, cols: cMax - cMin + 1 })
    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        if (r === rMin && c === cMin) continue
        hidden.add(`${r},${c}`)
      }
    }
  }
  return { anchors, hidden }
}
