import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (k < 1 || k > nums.length) return '#NUM!'
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
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

/** SAMPLE(range) — random non-empty cell value from range. */
export function sample(rangeStr: string, cells: Record<string, string>, evalRaw: (s: string) => string): string {
  const refs = collectRefs(rangeStr)
  const vals = refs.map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  return vals[Math.floor(Math.random() * vals.length)]
}

/** RANK(value, range, [order]) — order 0 (default) descending, non-zero ascending. */
export function rank(value: number, rangeStr: string, order: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (!nums.includes(value)) return '#N/A'
  const desc = order === 0
  return String(nums.filter((n) => desc ? n > value : n < value).length + 1)
}

export function aggregate(F: string, rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F !== 'SUM' && F !== 'AVERAGE' && F !== 'MIN' && F !== 'MAX' && F !== 'COUNT' && F !== 'MEDIAN' && F !== 'STDEV' && F !== 'STDEVP' && F !== 'VAR' && F !== 'VARP' && F !== 'MODE' && F !== 'PRODUCT' && F !== 'SUMSQ' && F !== 'GEOMEAN' && F !== 'HARMEAN' && F !== 'AVEDEV' && F !== 'MAXA' && F !== 'MINA' && F !== 'AVERAGEA') return null
  const nums = collectRefs(rawArgs).map(numFromCell)
  if (F === 'PRODUCT') return String(nums.reduce((a, b) => a * b, 1))
  if (F === 'SUMSQ') return String(nums.reduce((a, b) => a + b * b, 0))
  if (F === 'AVEDEV') {
    if (nums.length === 0) return '#NUM!'
    const m = nums.reduce((a, b) => a + b, 0) / nums.length
    return String(nums.reduce((a, b) => a + Math.abs(b - m), 0) / nums.length)
  }
  if (F === 'GEOMEAN') return nums.length ? String(Math.pow(nums.reduce((a, b) => a * b, 1), 1 / nums.length)) : '#NUM!'
  if (F === 'HARMEAN') return nums.length ? String(nums.length / nums.reduce((a, b) => a + 1 / b, 0)) : '#NUM!'
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
  if (F === 'MAXA' || F === 'MINA' || F === 'AVERAGEA') {
    const refs = collectRefs(rawArgs)
    const vs = refs.map((r) => numFromCell(r))
    if (vs.length === 0) return '0'
    if (F === 'MAXA') return String(Math.max(...vs))
    if (F === 'MINA') return String(Math.min(...vs))
    return String(vs.reduce((a, b) => a + b, 0) / vs.length)
  }
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
