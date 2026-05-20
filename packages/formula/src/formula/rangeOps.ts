import type { Cells } from '../a1'
import type { NumFromCell, EvalCell } from "./args"
import { collectRefs } from './parse'


export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (k < 1 || k > nums.length) return '#NUM!'
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
}

export function sumproduct(rangeStrs: string[], numFromCell: NumFromCell): string {
  if (rangeStrs.length === 0) return '0'
  const cols = rangeStrs.map((s) => collectRefs(s).map(numFromCell))
  const len = Math.min(...cols.map((c) => c.length))
  let sum = 0
  for (let i = 0; i < len; i++) {
    let p = 1
    for (const c of cols) p *= (c[i] ?? 0)
    sum += p
  }
  return String(sum)
}

export function weightAvg(vStr: string, wStr: string, numFromCell: NumFromCell): string {
  const V = collectRefs(vStr).map(numFromCell)
  const W = collectRefs(wStr).map(numFromCell)
  const n = Math.min(V.length, W.length)
  if (n === 0) return '#NUM!'
  let s = 0, t = 0
  for (let i = 0; i < n; i++) { s += V[i] * W[i]; t += W[i] }
  return t === 0 ? '#DIV/0!' : String(s / t)
}

export function maxMinBy(F: 'MAX_BY' | 'MIN_BY', valStr: string, keyStr: string, _cells: Cells, evalCell: EvalCell, numFromCell: NumFromCell): string {
  const vals = collectRefs(valStr)
  const keys = collectRefs(keyStr).map(numFromCell)
  if (keys.length === 0) return '#N/A'
  let best = 0
  for (let i = 1; i < keys.length; i++) if (F === 'MAX_BY' ? keys[i] > keys[best] : keys[i] < keys[best]) best = i
  return evalCell(vals[best])
}

/** JACCARD(rangeA, rangeB) — |A∩B|/|A∪B| over distinct non-empty values. */
export function jaccard(aStr: string, bStr: string, _cells: Cells, evalCell: EvalCell): string {
  const set = (s: string) => new Set(collectRefs(s).map(evalCell).filter((v) => v !== ''))
  const A = set(aStr), B = set(bStr)
  const uni = new Set([...A, ...B])
  if (uni.size === 0) return '#N/A'
  let inter = 0
  for (const v of A) if (B.has(v)) inter++
  return String(inter / uni.size)
}

export function rank(value: number, rangeStr: string, order: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (!nums.includes(value)) return '#N/A'
  const desc = order === 0
  return String(nums.filter((n) => desc ? n > value : n < value).length + 1)
}

export { sample, arrayToText, firstLast, strStat, lenStat, rangeHash, countNumeric, mostCommon, freqStat, rangeCsv, rangeJSON, rangeSort, rangeUnique, entropy } from './rangeStr'
