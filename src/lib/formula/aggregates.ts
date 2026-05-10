import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (k < 1 || k > nums.length) return '#NUM!'
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
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

/** PERCENTILE(range, p) — linear interpolation, p in [0,1]. */
export function percentile(rangeStr: string, p: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (nums.length === 0 || p < 0 || p > 1) return '#NUM!'
  const idx = p * (nums.length - 1)
  const lo = Math.floor(idx), hi = Math.ceil(idx)
  return String(lo === hi ? nums[lo] : nums[lo] + (nums[hi] - nums[lo]) * (idx - lo))
}

/** QUARTILE(range, q) — q in 0..4 mapped to PERCENTILE 0/.25/.5/.75/1. */
export function quartile(rangeStr: string, q: number, numFromCell: NumFromCell): string {
  if (q < 0 || q > 4 || !Number.isInteger(q)) return '#NUM!'
  return percentile(rangeStr, q / 4, numFromCell)
}

/** SUMPRODUCT(rangeA, rangeB, ...) — element-wise product summed across same-shape ranges. */
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

/** RANK(value, range, [order]) — order 0 (default) descending, non-zero ascending. */
export function rank(value: number, rangeStr: string, order: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (!nums.includes(value)) return '#N/A'
  const desc = order === 0
  return String(nums.filter((n) => desc ? n > value : n < value).length + 1)
}

export function aggregate(F: string, rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F !== 'SUM' && F !== 'AVERAGE' && F !== 'MIN' && F !== 'MAX' && F !== 'COUNT' && F !== 'MEDIAN' && F !== 'STDEV' && F !== 'STDEVP' && F !== 'VAR' && F !== 'VARP' && F !== 'MODE' && F !== 'PRODUCT') return null
  const nums = collectRefs(rawArgs).map(numFromCell)
  if (F === 'PRODUCT') return String(nums.reduce((a, b) => a * b, 1))
  if (F === 'MODE') {
    const counts = new Map<number, number>()
    for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1)
    let best = nums[0] ?? 0, bc = 0
    for (const [n, c] of counts) if (c > bc) { best = n; bc = c }
    return String(best)
  }
  if (F === 'SUM') return String(nums.reduce((a, b) => a + b, 0))
  const mean = nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length)
  if (F === 'AVERAGE') return String(mean)
  if (F === 'MIN') return String(Math.min(...nums))
  if (F === 'MAX') return String(Math.max(...nums))
  if (F === 'COUNT') return String(nums.length)
  if (F === 'MEDIAN') {
    const s = [...nums].sort((a, b) => a - b)
    const m = s.length
    if (m === 0) return '0'
    return String(m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2)
  }
  const ss = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0)
  const variance = ss / Math.max(1, nums.length - 1)
  const variancep = ss / Math.max(1, nums.length)
  if (F === 'VAR') return String(variance)
  if (F === 'VARP') return String(variancep)
  if (F === 'STDEVP') return String(Math.sqrt(variancep))
  return String(Math.sqrt(variance))
}
