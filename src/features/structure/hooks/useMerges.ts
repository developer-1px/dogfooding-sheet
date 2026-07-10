import type { SheetOps } from '../../../entities/Sheet/schema'
import { addMergeToList, buildMergeMap, isValidMerge, normalizeMergeList, removeMergeAt, type Merge, type MergeBounds } from '@spredsheet/grid'

export { buildMergeMap }

export interface MergeMutationCommands {
  addMerge(merge: Merge): boolean
  removeMerge(index: number): boolean
}

const sameMerge = (a: Merge, b: Merge): boolean =>
  a[0] === b[0] &&
  a[1] === b[1] &&
  a[2] === b[2] &&
  a[3] === b[3]

export const sameMergeList = (a: ReadonlyArray<Merge>, b: ReadonlyArray<Merge>): boolean =>
  a.length === b.length && a.every((merge, index) => b[index] !== undefined && sameMerge(merge, b[index]))

const appendedMerge = (current: ReadonlyArray<Merge>, next: ReadonlyArray<Merge>): Merge | null =>
  next.length === current.length + 1 &&
    current.every((merge, index) => sameMerge(merge, next[index] as Merge))
    ? (next[next.length - 1] ?? null)
    : null

const removedMergeIndex = (current: ReadonlyArray<Merge>, next: ReadonlyArray<Merge>): number | null => {
  if (current.length !== next.length + 1) return null
  let removed: number | null = null
  let nextIndex = 0
  for (let currentIndex = 0; currentIndex < current.length; currentIndex += 1) {
    const nextMerge = next[nextIndex]
    if (nextMerge !== undefined && sameMerge(current[currentIndex] as Merge, nextMerge)) {
      nextIndex += 1
      continue
    }
    if (removed !== null) return null
    removed = currentIndex
  }
  return nextIndex === next.length ? removed : null
}

export function useMerges(
  merges: ReadonlyArray<Merge>,
  ops: SheetOps,
  bounds?: MergeBounds,
  commands?: MergeMutationCommands,
) {
  const current = bounds ? normalizeMergeList(merges, bounds) : [...merges]
  const storedIsCurrent = sameMergeList(merges, current)

  const addMerge = (m: Merge) => {
    if (bounds && !isValidMerge(m, bounds)) return
    const next = bounds ? normalizeMergeList(addMergeToList(current, m), bounds) : addMergeToList(current, m)
    if (sameMergeList(current, next)) return
    const appended = storedIsCurrent ? appendedMerge(current, next) : null
    if (appended && commands?.addMerge(appended)) return
    ops.replace('/merges', next)
  }
  const unmergeAt = (r: number, c: number) => {
    if (bounds && (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= bounds.rowCount || c < 0 || c >= bounds.colCount)) return
    const next = removeMergeAt(current, r, c)
    if (next.length === current.length) return
    const removed = storedIsCurrent ? removedMergeIndex(current, next) : null
    if (removed !== null && commands?.removeMerge(removed)) return
    ops.replace('/merges', next)
  }
  return { addMerge, unmergeAt }
}
