import { splitArgs, type Ctx } from './args'
import { coerceNumber } from './coerce'
import { isErrorValue } from './errorValue'
import { wrap } from './marker'
import { collectRefs } from './parse'

const unquote = (arg: string): string => {
  const s = arg.trim()
  return s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s
}

const numericCellValues = (refs: string[], c: Ctx): number[] =>
  refs
    .map((ref) => coerceNumber(c.evalRaw(c.cells[ref] ?? '')))
    .filter(Number.isFinite)

const firstError = (refs: string[], args: string[], c: Ctx): string | undefined => {
  for (const ref of refs) {
    const value = c.evalRaw(c.cells[ref] ?? '')
    if (isErrorValue(value)) return value
  }
  for (const arg of args.filter((a) => !isPureRefArg(a))) {
    const s = arg.trim()
    if (s.startsWith('"') && s.endsWith('"')) continue
    if (Number.isFinite(coerceNumber(unquote(arg)))) continue
    const value = c.evalRaw(`=${arg}`)
    if (isErrorValue(value)) return value
  }
  return undefined
}

const literalNumber = (arg: string, c: Ctx): number => {
  const direct = coerceNumber(unquote(arg))
  if (Number.isFinite(direct)) return direct
  return coerceNumber(c.evalRaw(`=${arg}`))
}

const isPureRefArg = (arg: string): boolean =>
  /^\s*\$?[A-Z]\$?\d+(?::\$?[A-Z]\$?\d+)?\s*$/.test(arg)

const collectArgRefs = (args: string[]): string[] => args.filter(isPureRefArg).flatMap((arg) => collectRefs(arg))

export function aggregate(F: string, rawArgs: string, c: Ctx): string | null {
  if (F !== 'SUM' && F !== 'AVERAGE' && F !== 'MIN' && F !== 'MAX' && F !== 'COUNT' && F !== 'MEDIAN' && F !== 'STDEV' && F !== 'STDEVP' && F !== 'VAR' && F !== 'VARP' && F !== 'MODE' && F !== 'PRODUCT' && F !== 'SUMSQ' && F !== 'GEOMEAN' && F !== 'HARMEAN' && F !== 'AVEDEV' && F !== 'MAXA' && F !== 'MINA' && F !== 'AVERAGEA') return null
  const args = splitArgs(rawArgs)
  const refs = collectArgRefs(args)
  const error = firstError(refs, args, c)
  if (error) return wrap(error)
  const literalNums = args
    .filter((arg) => !isPureRefArg(arg))
    .map((arg) => literalNumber(arg, c))
    .filter(Number.isFinite)
  const nums = [...numericCellValues(refs, c), ...literalNums]
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
  if (nums.length === 0) {
    if (F === 'COUNT') return '0'
    if (F === 'AVERAGE' || F === 'MEDIAN' || F === 'STDEV' || F === 'STDEVP' || F === 'VAR' || F === 'VARP') return wrap('#DIV/0!')
    return wrap('#VALUE!')
  }
  const mean = nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length)
  if (F === 'AVERAGE') return String(mean)
  if (F === 'MIN') return String(Math.min(...nums))
  if (F === 'MAX') return String(Math.max(...nums))
  if (F === 'COUNT') return String(nums.length)
  if (F === 'MAXA' || F === 'MINA' || F === 'AVERAGEA') {
    const vs = [...refs.map((r) => c.numFromCell(r)), ...literalNums]
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
