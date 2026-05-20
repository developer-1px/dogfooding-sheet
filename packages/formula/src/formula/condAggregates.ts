import type { EvalCell } from './args'
import { coerceNumber } from './coerce'
import { collectRefs } from './parse'
import { compileCriteria } from './criteriaMatch'

const valueError = (): string => '#VALUE!'
const numError = (): string => '#NUM!'

const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

const hasCriteriaArg = (value: string | undefined): value is string =>
  value !== undefined

const finiteResult = (value: number): number | string =>
  Number.isFinite(value) ? value : numError()

export function countif(rangeStr: string | undefined, criteria: string | undefined, evalCell: EvalCell): number | string {
  if (!hasRangeArg(rangeStr) || !hasCriteriaArg(criteria)) return valueError()
  const refs = collectRefs(rangeStr)
  const matches = compileCriteria(criteria)
  let n = 0
  for (const r of refs) {
    if (matches(evalCell(r))) n++
  }
  return n
}

export function sumif(
  rangeStr: string | undefined,
  criteria: string | undefined,
  sumRangeStr: string | undefined,
  evalCell: EvalCell,
): number | string {
  if (!hasRangeArg(rangeStr) || !hasCriteriaArg(criteria)) return valueError()
  const refs = collectRefs(rangeStr)
  const sumRefs = sumRangeStr ? collectRefs(sumRangeStr) : refs
  const matches = compileCriteria(criteria)
  let sum = 0
  for (let i = 0; i < refs.length; i++) {
    if (matches(evalCell(refs[i]))) {
      const v = coerceNumber(evalCell(sumRefs[i] ?? refs[i]))
      if (Number.isFinite(v)) sum += v
    }
  }
  return finiteResult(sum)
}

export function counta(rangeStr: string | undefined, evalCell: EvalCell): number | string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const refs = collectRefs(rangeStr)
  let n = 0
  for (const r of refs) {
    if (evalCell(r) !== '') n++
  }
  return n
}

export function countblank(rangeStr: string | undefined, evalCell: EvalCell): number | string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const refs = collectRefs(rangeStr)
  let n = 0
  for (const r of refs) {
    if (evalCell(r) === '') n++
  }
  return n
}

export function countunique(rangeStr: string | undefined, evalCell: EvalCell): number | string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const seen = new Set<string>()
  for (const r of collectRefs(rangeStr)) {
    const v = evalCell(r)
    if (v !== '') seen.add(v)
  }
  return seen.size
}

export function averageif(
  rangeStr: string | undefined,
  criteria: string | undefined,
  avgRangeStr: string | undefined,
  evalCell: EvalCell,
): number | string {
  if (!hasRangeArg(rangeStr) || !hasCriteriaArg(criteria)) return valueError()
  const refs = collectRefs(rangeStr)
  const avgRefs = avgRangeStr ? collectRefs(avgRangeStr) : refs
  const matches = compileCriteria(criteria)
  let sum = 0, n = 0
  for (let i = 0; i < refs.length; i++) {
    if (!matches(evalCell(refs[i]))) continue
    const v = coerceNumber(evalCell(avgRefs[i] ?? refs[i]))
    if (Number.isFinite(v)) { sum += v; n++ }
  }
  return n > 0 ? finiteResult(sum / n) : '#DIV/0!'
}
