import type { Cells } from '../a1'
import type { EvalCell } from './args'
import { stringifyFormulaArray } from './arraySafety'
import { collectRefs } from './parse'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

const valueError = (): string => '#VALUE!'
const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

const vals = (r: string, e: EvalCell): string[] => {
  const values: string[] = []
  for (const ref of collectRefs(r)) values.push(e(ref))
  return values
}

/** RANGEJSON(range) — JSON array of evaluated values. */
export const rangeJSON = (r: string | undefined, _c: Cells, e: EvalCell) =>
  hasRangeArg(r) ? stringifyFormulaArray(vals(r, e)) : valueError()

/** RANGECSV(range) — values comma-separated, double-quote escaped if needed. */
export const rangeCsv = (r: string | undefined, _c: Cells, e: EvalCell) => {
  if (!hasRangeArg(r)) return valueError()
  const out: string[] = []
  let length = 0
  for (const ref of collectRefs(r)) {
    const value = e(ref)
    const cell = /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
    length += cell.length + (out.length > 0 ? 1 : 0)
    if (length > MAX_GENERATED_TEXT_LENGTH) return valueError()
    out.push(cell)
  }
  return out.join(',')
}

/** RANGEUNIQUE(range) — JSON array of unique non-empty values, first-occurrence order. */
export function rangeUnique(r: string | undefined, _c: Cells, e: EvalCell): string {
  if (!hasRangeArg(r)) return valueError()
  const seen = new Set<string>(), out: string[] = []
  for (const ref of collectRefs(r)) {
    const v = e(ref)
    if (v !== '' && !seen.has(v)) { seen.add(v); out.push(v) }
  }
  return stringifyFormulaArray(out)
}

/** RANGESORT(range) — JSON array of values sorted ascending (numeric if all finite, else lexical). */
export function rangeSort(r: string | undefined, _c: Cells, e: EvalCell): string {
  if (!hasRangeArg(r)) return valueError()
  const v = vals(r, e).filter((x) => x !== '')
  const nums = v.map(Number)
  const sorted = nums.every(Number.isFinite) ? [...nums].sort((a, b) => a - b).map(String) : [...v].sort()
  return stringifyFormulaArray(sorted)
}
