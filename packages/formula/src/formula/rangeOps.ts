import type { Cells } from '../a1'
import type { NumFromCell, EvalCell } from "./args"
import { collectRefs } from './parse'

const valueError = (): string => '#VALUE!'
const numError = (): string => '#NUM!'
const divZeroError = (): string => '#DIV/0!'

const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

const finiteResult = (value: number): string =>
  Number.isFinite(value) ? String(value) : numError()

export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  if (!hasRangeArg(rangeStr) || !Number.isFinite(k)) return valueError()
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (!Number.isInteger(k) || k < 1 || k > nums.length) return numError()
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
}

export function sumproduct(rangeStrs: string[], numFromCell: NumFromCell): string {
  if (rangeStrs.length === 0) return '0'
  if (rangeStrs.some((s) => !hasRangeArg(s))) return valueError()
  const cols = rangeStrs.map(collectRefs)
  let len = cols[0]?.length ?? 0
  for (let i = 1; i < cols.length; i++) len = Math.min(len, cols[i].length)
  let sum = 0
  for (let i = 0; i < len; i++) {
    let p = 1
    for (const c of cols) p *= numFromCell(c[i])
    sum += p
  }
  return finiteResult(sum)
}

export function weightAvg(vStr: string, wStr: string, numFromCell: NumFromCell): string {
  if (!hasRangeArg(vStr) || !hasRangeArg(wStr)) return valueError()
  const V = collectRefs(vStr)
  const W = collectRefs(wStr)
  const n = Math.min(V.length, W.length)
  if (n === 0) return numError()
  let s = 0, t = 0
  for (let i = 0; i < n; i++) {
    const v = numFromCell(V[i])
    const w = numFromCell(W[i])
    s += v * w
    t += w
  }
  return t === 0 ? divZeroError() : finiteResult(s / t)
}

export function maxMinBy(F: 'MAX_BY' | 'MIN_BY', valStr: string, keyStr: string, _cells: Cells, evalCell: EvalCell, numFromCell: NumFromCell): string {
  if (!hasRangeArg(valStr) || !hasRangeArg(keyStr)) return valueError()
  const vals = collectRefs(valStr)
  const keys = collectRefs(keyStr)
  const n = Math.min(vals.length, keys.length)
  if (n === 0) return '#N/A'
  let best = 0
  let bestKey = numFromCell(keys[0])
  for (let i = 1; i < n; i++) {
    const key = numFromCell(keys[i])
    if (F === 'MAX_BY' ? key > bestKey : key < bestKey) {
      best = i
      bestKey = key
    }
  }
  return evalCell(vals[best])
}

/** JACCARD(rangeA, rangeB) — |A∩B|/|A∪B| over distinct non-empty values. */
export function jaccard(aStr: string, bStr: string, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(aStr) || !hasRangeArg(bStr)) return valueError()
  const set = (rangeStr: string) => {
    const values = new Set<string>()
    for (const ref of collectRefs(rangeStr)) {
      const value = evalCell(ref)
      if (value !== '') values.add(value)
    }
    return values
  }
  const A = set(aStr), B = set(bStr)
  let unionSize = A.size
  let inter = 0
  for (const value of B) {
    if (A.has(value)) inter++
    else unionSize++
  }
  if (unionSize === 0) return '#N/A'
  return finiteResult(inter / unionSize)
}

export function rank(value: number, rangeStr: string, order: number, numFromCell: NumFromCell): string {
  if (!hasRangeArg(rangeStr) || !Number.isFinite(value) || !Number.isFinite(order)) return valueError()
  const desc = order === 0
  let found = false
  let ahead = 0
  for (const ref of collectRefs(rangeStr)) {
    const n = numFromCell(ref)
    if (!Number.isFinite(n)) continue
    if (n === value) found = true
    if (desc ? n > value : n < value) ahead++
  }
  return found ? String(ahead + 1) : '#N/A'
}

export { sample, arrayToText, firstLast, strStat, lenStat, rangeHash, countNumeric, mostCommon, freqStat, rangeCsv, rangeJSON, rangeSort, rangeUnique, entropy } from './rangeStr'
