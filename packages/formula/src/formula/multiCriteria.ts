import type { EvalCell } from './args'
import { collectRefs } from './parse'
import { matchCriteria } from './criteriaMatch'
import { coerceNumber } from './coerce'


/** Build a predicate from interleaved (range, criteria) pairs. */
const matchAll = (pairs: string[], evalCell: EvalCell) =>
  (i: number): boolean => {
    for (let p = 0; p < pairs.length; p += 2) {
      const refs = collectRefs(pairs[p])
      if (!matchCriteria(evalCell(refs[i]), pairs[p + 1])) return false
    }
    return true
  }

export function countifs(args: string[], evalCell: EvalCell): number {
  const len = collectRefs(args[0]).length
  const pred = matchAll(args, evalCell)
  let n = 0
  for (let i = 0; i < len; i++) if (pred(i)) n++
  return n
}

export function sumifs(args: string[], evalCell: EvalCell): number {
  const sumRefs = collectRefs(args[0])
  const pred = matchAll(args.slice(1), evalCell)
  let sum = 0
  for (let i = 0; i < sumRefs.length; i++) {
    if (!pred(i)) continue
    const v = coerceNumber(evalCell(sumRefs[i]))
    if (Number.isFinite(v)) sum += v
  }
  return sum
}

export function averageifs(args: string[], evalCell: EvalCell): number | string {
  const avgRefs = collectRefs(args[0])
  const pred = matchAll(args.slice(1), evalCell)
  let sum = 0
  let count = 0
  for (let i = 0; i < avgRefs.length; i++) {
    if (!pred(i)) continue
    const v = coerceNumber(evalCell(avgRefs[i]))
    if (!Number.isFinite(v)) continue
    sum += v
    count++
  }
  return count ? sum / count : '#DIV/0!'
}

export function minMaxIf(
  pick: 'MIN' | 'MAX',
  valueRangeStr: string,
  critRangeStr: string,
  criteria: string,
  evalCell: EvalCell,
): number {
  const values = collectRefs(valueRangeStr)
  const crits = collectRefs(critRangeStr)
  const picked: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (!matchCriteria(evalCell(crits[i] ?? values[i]), criteria)) continue
    const v = coerceNumber(evalCell(values[i]))
    if (Number.isFinite(v)) picked.push(v)
  }
  if (picked.length === 0) return 0
  return pick === 'MIN' ? Math.min(...picked) : Math.max(...picked)
}
