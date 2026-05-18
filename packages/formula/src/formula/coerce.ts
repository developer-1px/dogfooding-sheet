export function coerceNumber(value: string): number {
  const s = value.trim()
  if (s === '') return NaN
  const paren = /^\((.*)\)$/.exec(s)
  const body = paren ? paren[1].trim() : s
  const percent = body.endsWith('%')
  const currencyStripped = body
    .replace(/^[+$€₩¥£]\s*/, '')
    .replace(/\s*[€₩¥£]$/, '')
  const raw = percent ? currencyStripped.slice(0, -1).trim() : currencyStripped
  const cleaned = raw.replace(/,/g, '')
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return NaN
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return NaN
  const signed = paren ? -n : n
  return percent ? signed / 100 : signed
}
