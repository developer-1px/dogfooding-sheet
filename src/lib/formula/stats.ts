import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

/** FORECAST(x, known_y, known_x) — predict y for given x via linear regression. */
export function forecast(x: number, yStr: string, xStr: string, numFromCell: NumFromCell): string {
  const Y = collectRefs(yStr).map(numFromCell)
  const X = collectRefs(xStr).map(numFromCell)
  const n = Math.min(Y.length, X.length)
  if (n === 0) return '#N/A'
  const my = Y.slice(0, n).reduce((s, v) => s + v, 0) / n
  const mx = X.slice(0, n).reduce((s, v) => s + v, 0) / n
  let cov = 0, vx = 0
  for (let i = 0; i < n; i++) { const dx = X[i] - mx; cov += dx * (Y[i] - my); vx += dx * dx }
  if (vx === 0) return '#DIV/0!'
  return String(my + (cov / vx) * (x - mx))
}

/** Paired stats: COVAR, CORREL, SLOPE (y on x), INTERCEPT (y on x). */
export function pairStat(F: 'COVAR' | 'CORREL' | 'SLOPE' | 'INTERCEPT', aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const A = collectRefs(aStr).map(numFromCell)
  const B = collectRefs(bStr).map(numFromCell)
  const n = Math.min(A.length, B.length)
  if (n === 0) return '#NUM!'
  const ma = A.slice(0, n).reduce((s, x) => s + x, 0) / n
  const mb = B.slice(0, n).reduce((s, x) => s + x, 0) / n
  let cov = 0, va = 0, vb = 0
  for (let i = 0; i < n; i++) {
    const da = A[i] - ma, db = B[i] - mb
    cov += da * db; va += da * da; vb += db * db
  }
  if (F === 'COVAR') return String(cov / n)
  if (F === 'SLOPE') return vb === 0 ? '#DIV/0!' : String(cov / vb)
  if (F === 'INTERCEPT') return vb === 0 ? '#DIV/0!' : String(ma - (cov / vb) * mb)
  return va === 0 || vb === 0 ? '#DIV/0!' : String(cov / Math.sqrt(va * vb))
}

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
