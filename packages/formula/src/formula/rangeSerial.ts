import type { Cells } from '../a1'
import type { Eval } from './args'
import { collectRefs } from './parse'

const vals = (r: string, cells: Cells, e: Eval) =>
  collectRefs(r).map((x) => e(cells[x] ?? ''))

/** RANGEJSON(range) — JSON array of evaluated values. */
export const rangeJson = (r: string, c: Cells, e: Eval) =>
  JSON.stringify(vals(r, c, e))

/** RANGECSV(range) — values comma-separated, double-quote escaped if needed. */
export const rangeCsv = (r: string, c: Cells, e: Eval) =>
  vals(r, c, e).map((v) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join(',')

/** RANGEUNIQUE(range) — JSON array of unique non-empty values, first-occurrence order. */
export function rangeUnique(r: string, c: Cells, e: Eval): string {
  const seen = new Set<string>(), out: string[] = []
  for (const v of vals(r, c, e)) if (v !== '' && !seen.has(v)) { seen.add(v); out.push(v) }
  return JSON.stringify(out)
}

/** RANGESORT(range) — JSON array of values sorted ascending (numeric if all finite, else lexical). */
export function rangeSort(r: string, c: Cells, e: Eval): string {
  const v = vals(r, c, e).filter((x) => x !== '')
  const nums = v.map(Number)
  const sorted = nums.every(Number.isFinite) ? [...nums].sort((a, b) => a - b).map(String) : [...v].sort()
  return JSON.stringify(sorted)
}
