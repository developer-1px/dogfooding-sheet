import type { NumFromCell } from './args'
import { collectRefs } from './parse'


export { forecast, pairStat } from './pairStats'

/** TRIMMEAN(range, fraction) — drop fraction*N from each end, average rest. */
export function trimmean(rangeStr: string, frac: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (frac < 0 || frac >= 1 || nums.length === 0) return '#NUM!'
  const drop = Math.floor((nums.length * frac) / 2)
  const kept = nums.slice(drop, nums.length - drop)
  return String(kept.reduce((a, b) => a + b, 0) / kept.length)
}

/** PERCENTILE(range, p) — linear interpolation, p in [0,1]. */
export function percentile(rangeStr: string, p: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (nums.length === 0 || p < 0 || p > 1) return '#NUM!'
  const idx = p * (nums.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return String(lo === hi ? nums[lo] : nums[lo] + (nums[hi] - nums[lo]) * (idx - lo))
}

/** GINI(range) — Gini coefficient of inequality, in [0,1]. */
export function gini(rangeStr: string, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b)
  const n = nums.length
  if (n === 0) return '#NUM!'
  const sum = nums.reduce((s, v) => s + v, 0)
  if (sum === 0) return '0'
  let cum = 0
  for (let i = 0; i < n; i++) cum += (i + 1) * nums[i]
  return String((2 * cum) / (n * sum) - (n + 1) / n)
}

/** SKEW: population skewness; KURT: excess kurtosis (Fisher). */
export function moment(F: 'SKEW' | 'KURT', rangeStr: string, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  const n = nums.length
  if (n < 2) return '#NUM!'
  const m = nums.reduce((s, v) => s + v, 0) / n
  let m2 = 0, m3 = 0, m4 = 0
  for (const v of nums) { const d = v - m, d2 = d * d; m2 += d2; m3 += d2 * d; m4 += d2 * d2 }
  m2 /= n; m3 /= n; m4 /= n
  if (m2 === 0) return '#DIV/0!'
  return String(F === 'SKEW' ? m3 / Math.pow(m2, 1.5) : m4 / (m2 * m2) - 3)
}

/** ZSCORE(value, range) — (value - mean) / stdev_population. */
export function zScore(value: number, rangeStr: string, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (nums.length === 0) return '#N/A'
  const m = nums.reduce((s, v) => s + v, 0) / nums.length
  const sd = Math.sqrt(nums.reduce((s, v) => s + (v - m) ** 2, 0) / nums.length)
  return sd === 0 ? '#DIV/0!' : String((value - m) / sd)
}

/** PERCENTRANK(range, value) — fraction of values strictly less than value, in [0,1]. */
export function percentRank(rangeStr: string, value: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (nums.length === 0) return '#N/A'
  if (value < Math.min(...nums) || value > Math.max(...nums)) return '#N/A'
  return String(nums.filter((n) => n < value).length / (nums.length - 1 || 1))
}

/** QUARTILE(range, q) — q in 0..4 mapped to PERCENTILE 0/.25/.5/.75/1. */
export function quartile(rangeStr: string, q: number, numFromCell: NumFromCell): string {
  if (q < 0 || q > 4 || !Number.isInteger(q)) return '#NUM!'
  return percentile(rangeStr, q / 4, numFromCell)
}
