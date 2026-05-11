import type { Eval } from './args'
import type { Cells } from '../a1'
import { collectRefs } from './parse'
import { matchCriteria } from './criteriaMatch'


/** Build a predicate from interleaved (range, criteria) pairs. */
const matchAll = (pairs: string[], cells: Cells, evalRaw: Eval) =>
  (i: number): boolean => {
    for (let p = 0; p < pairs.length; p += 2) {
      const refs = collectRefs(pairs[p])
      if (!matchCriteria(evalRaw(cells[refs[i]] ?? ''), pairs[p + 1])) return false
    }
    return true
  }

export function countifs(args: string[], cells: Cells, evalRaw: Eval): number {
  const len = collectRefs(args[0]).length
  const pred = matchAll(args, cells, evalRaw)
  let n = 0
  for (let i = 0; i < len; i++) if (pred(i)) n++
  return n
}

export function sumifs(args: string[], cells: Cells, evalRaw: Eval): number {
  const sumRefs = collectRefs(args[0])
  const pred = matchAll(args.slice(1), cells, evalRaw)
  let sum = 0
  for (let i = 0; i < sumRefs.length; i++) {
    if (!pred(i)) continue
    const v = Number(evalRaw(cells[sumRefs[i]] ?? ''))
    if (Number.isFinite(v)) sum += v
  }
  return sum
}

export function minMaxIf(
  pick: 'MIN' | 'MAX',
  valueRangeStr: string,
  critRangeStr: string,
  criteria: string,
  cells: Cells,
  evalRaw: Eval,
): number {
  const values = collectRefs(valueRangeStr)
  const crits = collectRefs(critRangeStr)
  const picked: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (!matchCriteria(evalRaw(cells[crits[i] ?? values[i]] ?? ''), criteria)) continue
    const v = Number(evalRaw(cells[values[i]] ?? ''))
    if (Number.isFinite(v)) picked.push(v)
  }
  if (picked.length === 0) return 0
  return pick === 'MIN' ? Math.min(...picked) : Math.max(...picked)
}
