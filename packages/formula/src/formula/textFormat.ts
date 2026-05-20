import { wrap } from './marker'
import { dispatchColor } from './colorFns'
import { dispatchHumanFmt } from './humanFmt'
import { coerceNumber } from './coerce'
import { boundedText } from './textLimit'

const MAX_FRACTION_DIGITS = 100

const currentLanguage = (): string => {
  const g = globalThis as { navigator?: { language?: string } }
  return g.navigator?.language ?? 'en-US'
}

const numberValue = (value: string, decimal: string, group: string): number => {
  const trimmed = value.trim()
  const paren = /^\((.*)\)$/.exec(trimmed)
  const body = (paren ? paren[1] : trimmed).replace(/\s+/g, '')
  const percentMatch = /%+$/.exec(body)
  const percentCount = percentMatch?.[0].length ?? 0
  const withoutPercent = percentCount > 0 ? body.slice(0, -percentCount) : body
  const withoutCurrency = withoutPercent
    .replace(/^[+$€₩¥£]/, '')
    .replace(/[€₩¥£]$/, '')
  const normalized = withoutCurrency.split(group).join('').split(decimal).join('.')
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return NaN
  const n = Number(normalized)
  if (!Number.isFinite(n)) return NaN
  const signed = paren ? -n : n
  return signed / (100 ** percentCount)
}

const wrapBounded = (value: string): string => wrap(boundedText(value) ?? '#VALUE!')

const fractionDigits = (value: number): number | null =>
  Number.isInteger(value) && value >= 0 && value <= MAX_FRACTION_DIGITS ? value : null

export function dispatchTextFormat(F: string, argsT: string[]): string | null {
  const col = dispatchColor(F, argsT); if (col !== null) return col
  const human = dispatchHumanFmt(F, argsT); if (human !== null) return human
  if (F === 'LANG') return wrap(currentLanguage())
  if (F === 'TIMEZONE') { try { return wrap(Intl.DateTimeFormat().resolvedOptions().timeZone) } catch { return wrap('UTC') } }
  if (F === 'STRINGIFY') return wrapBounded(JSON.stringify(argsT.length === 1 ? argsT[0] : argsT))
  if (F === 'TEXT') {
    const n = Number(argsT[0]); const fmt = argsT[1] ?? ''
    if (!Number.isFinite(n)) return wrapBounded(argsT[0])
    const dec = fractionDigits((fmt.split('.')[1] ?? '').length)
    if (dec === null) return wrap('#VALUE!')
    const grouped = fmt.includes(',')
    const isPct = fmt.endsWith('%')
    const v = isPct ? n * 100 : n
    if (!Number.isFinite(v)) return wrap('#VALUE!')
    return wrapBounded(v.toLocaleString('en-US', {
      minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouped,
    }) + (isPct ? '%' : ''))
  }
  if (F === 'DOLLAR') {
    const n = Number(argsT[0]); const d = Number(argsT[1] ?? '2')
    if (!Number.isFinite(n)) return wrap('#VALUE!')
    const dec = fractionDigits(d)
    if (dec === null) return wrap('#VALUE!')
    return wrapBounded('$' + n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }))
  }
  if (F === 'NUMBERVALUE') {
    const dec = argsT[1] ?? '.', grp = argsT[2] ?? ','
    const n = numberValue(argsT[0] ?? '', dec, grp)
    return Number.isFinite(n) ? String(n) : wrap('#VALUE!')
  }
  if (F === 'VALUE') {
    const n = coerceNumber(argsT[0])
    return Number.isFinite(n) ? String(n) : wrap('#VALUE!')
  }
  if (F === 'N') {
    const n = coerceNumber(argsT[0])
    return Number.isFinite(n) ? String(n) : '0'
  }
  return null
}
