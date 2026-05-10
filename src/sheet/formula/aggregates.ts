import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

export function aggregate(F: string, rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F !== 'SUM' && F !== 'AVERAGE' && F !== 'MIN' && F !== 'MAX' && F !== 'COUNT' && F !== 'MEDIAN' && F !== 'STDEV' && F !== 'VAR') return null
  const nums = collectRefs(rawArgs).map(numFromCell)
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
  const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / Math.max(1, nums.length - 1)
  if (F === 'VAR') return String(variance)
  return String(Math.sqrt(variance))
}
