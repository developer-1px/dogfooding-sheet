import type { Cells } from '../a1'
import type { EvalCell } from './args'
import { stringifyFormulaArray } from './arraySafety'
import { collectRefs } from './parse'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

const valueError = (): string => '#VALUE!'
const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

const vals = (r: string, _cells: Cells, e: EvalCell) =>
  collectRefs(r).map(e)

/** RANGEJSON(range) — JSON array of evaluated values. */
export const rangeJSON = (r: string | undefined, c: Cells, e: EvalCell) =>
  hasRangeArg(r) ? stringifyFormulaArray(vals(r, c, e)) : valueError()

/** RANGECSV(range) — values comma-separated, double-quote escaped if needed. */
export const rangeCsv = (r: string | undefined, c: Cells, e: EvalCell) => {
  if (!hasRangeArg(r)) return valueError()
  const csv = vals(r, c, e).map((v) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join(',')
  return csv.length <= MAX_GENERATED_TEXT_LENGTH ? csv : '#VALUE!'
}

/** RANGEUNIQUE(range) — JSON array of unique non-empty values, first-occurrence order. */
export function rangeUnique(r: string | undefined, c: Cells, e: EvalCell): string {
  if (!hasRangeArg(r)) return valueError()
  const seen = new Set<string>(), out: string[] = []
  for (const v of vals(r, c, e)) if (v !== '' && !seen.has(v)) { seen.add(v); out.push(v) }
  return stringifyFormulaArray(out)
}

/** RANGESORT(range) — JSON array of values sorted ascending (numeric if all finite, else lexical). */
export function rangeSort(r: string | undefined, c: Cells, e: EvalCell): string {
  if (!hasRangeArg(r)) return valueError()
  const v = vals(r, c, e).filter((x) => x !== '')
  const nums = v.map(Number)
  const sorted = nums.every(Number.isFinite) ? [...nums].sort((a, b) => a - b).map(String) : [...v].sort()
  return stringifyFormulaArray(sorted)
}
