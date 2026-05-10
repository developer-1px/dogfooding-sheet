import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (k < 1 || k > nums.length) return '#NUM!'
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
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
