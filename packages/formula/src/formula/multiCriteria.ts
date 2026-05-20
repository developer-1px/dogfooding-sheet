import type { EvalCell } from './args'
import { collectRefs } from './parse'
import { compileCriteria, type CriteriaMatcher } from './criteriaMatch'
import { coerceNumber } from './coerce'


type CompiledCriteriaRange = {
  refs: string[]
  matches: CriteriaMatcher
}

const valueError = (): string => '#VALUE!'
const numError = (): string => '#NUM!'

const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

const validCriteriaPairs = (args: string[], offset = 0): boolean =>
  args.length > offset && (args.length - offset) % 2 === 0

const finiteResult = (value: number): number | string =>
  Number.isFinite(value) ? value : numError()

/** Build a predicate from interleaved (range, criteria) pairs. */
const matchAll = (pairs: string[], evalCell: EvalCell) => {
  const compiled: CompiledCriteriaRange[] = []

  for (let p = 0; p < pairs.length; p += 2) {
    compiled.push({
      refs: collectRefs(pairs[p]),
      matches: compileCriteria(pairs[p + 1] ?? ''),
    })
  }

  return (i: number): boolean => {
    for (const pair of compiled) {
      if (!pair.matches(evalCell(pair.refs[i] ?? ''))) return false
    }
    return true
  }
}

export function countifs(args: string[], evalCell: EvalCell): number | string {
  if (!validCriteriaPairs(args) || args.some((arg, index) => index % 2 === 0 && !hasRangeArg(arg))) return valueError()
  const len = collectRefs(args[0]).length
  const pred = matchAll(args, evalCell)
  let n = 0
  for (let i = 0; i < len; i++) if (pred(i)) n++
  return n
}

export function sumifs(args: string[], evalCell: EvalCell): number | string {
  if (!hasRangeArg(args[0]) || !validCriteriaPairs(args, 1) || args.slice(1).some((arg, index) => index % 2 === 0 && !hasRangeArg(arg))) return valueError()
  const sumRefs = collectRefs(args[0])
  const pred = matchAll(args.slice(1), evalCell)
  let sum = 0
  for (let i = 0; i < sumRefs.length; i++) {
    if (!pred(i)) continue
    const v = coerceNumber(evalCell(sumRefs[i]))
    if (Number.isFinite(v)) sum += v
  }
  return finiteResult(sum)
}

export function averageifs(args: string[], evalCell: EvalCell): number | string {
  if (!hasRangeArg(args[0]) || !validCriteriaPairs(args, 1) || args.slice(1).some((arg, index) => index % 2 === 0 && !hasRangeArg(arg))) return valueError()
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
  return count ? finiteResult(sum / count) : '#DIV/0!'
}

export function minMaxIf(
  pick: 'MIN' | 'MAX',
  valueRangeStr: string | undefined,
  critRangeStr: string | undefined,
  criteria: string | undefined,
  evalCell: EvalCell,
): number | string {
  if (!hasRangeArg(valueRangeStr) || !hasRangeArg(critRangeStr) || criteria === undefined) return valueError()
  const values = collectRefs(valueRangeStr)
  const crits = collectRefs(critRangeStr)
  const matches = compileCriteria(criteria)
  let count = 0
  let best = pick === 'MIN' ? Infinity : -Infinity
  for (let i = 0; i < values.length; i++) {
    if (!matches(evalCell(crits[i] ?? values[i]))) continue
    const v = coerceNumber(evalCell(values[i]))
    if (!Number.isFinite(v)) continue
    count++
    if (pick === 'MIN' ? v < best : v > best) best = v
  }
  return count === 0 ? 0 : finiteResult(best)
}
