import { wrap } from './marker'
import { dispatchColor } from './colorFns'

export function dispatchTextFormat(F: string, argsT: string[]): string | null {
  const col = dispatchColor(F, argsT); if (col !== null) return col
  if (F === 'LANG') return wrap(typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  if (F === 'TIMEZONE') { try { return wrap(Intl.DateTimeFormat().resolvedOptions().timeZone) } catch { return wrap('UTC') } }
  if (F === 'STRINGIFY') return wrap(JSON.stringify(argsT.length === 1 ? argsT[0] : argsT))
  if (F === 'KORNUM') {
    const n = Number(argsT[0])
    if (!Number.isFinite(n)) return wrap('#VALUE!')
    const sign = n < 0 ? '-' : ''
    let v = Math.floor(Math.abs(n))
    if (v < 10000) return wrap(sign + v.toLocaleString('ko-KR'))
    const units = ['', '만', '억', '조', '경']
    const parts: string[] = []
    for (let i = 0; v > 0 && i < units.length; i++) {
      const part = v % 10000
      if (part) parts.unshift(part.toLocaleString('ko-KR') + units[i])
      v = Math.floor(v / 10000)
    }
    return wrap(sign + parts.join(' '))
  }
  if (F === 'RELATIVETIME') {
    const t = Number(argsT[0])
    if (!Number.isFinite(t)) return wrap('#VALUE!')
    const diff = Math.floor(Date.now() / 1000) - t
    const a = Math.abs(diff), past = diff >= 0
    const fmt = (n: number, unit: string) => `${n}${unit} ${past ? '전' : '후'}`
    if (a < 60) return wrap('방금')
    if (a < 3600) return wrap(fmt(Math.floor(a / 60), '분'))
    if (a < 86400) return wrap(fmt(Math.floor(a / 3600), '시간'))
    if (a < 2592000) return wrap(fmt(Math.floor(a / 86400), '일'))
    return wrap(fmt(Math.floor(a / 2592000), '개월'))
  }
  if (F === 'FORMATDURATION') {
    const s = Math.floor(Number(argsT[0]))
    if (!Number.isFinite(s)) return wrap('#VALUE!')
    const sign = s < 0 ? '-' : '', n = Math.abs(s)
    const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), sec = n % 60
    const parts = []
    if (h) parts.push(`${h}h`)
    if (h || m) parts.push(`${m}m`)
    parts.push(`${sec}s`)
    return wrap(sign + parts.join(' '))
  }
  if (F === 'FORMATBYTES') {
    const n = Number(argsT[0])
    if (!Number.isFinite(n)) return wrap('#VALUE!')
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let v = Math.abs(n), i = 0
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
    return wrap((n < 0 ? '-' : '') + (i === 0 ? v.toString() : v.toFixed(2)) + ' ' + units[i])
  }
  if (F === 'TEXT') {
    const n = Number(argsT[0]); const fmt = argsT[1] ?? ''
    if (!Number.isFinite(n)) return wrap(argsT[0])
    const dec = (fmt.split('.')[1] ?? '').length
    const grouped = fmt.includes(',')
    const isPct = fmt.endsWith('%')
    const v = isPct ? n * 100 : n
    return wrap(v.toLocaleString('en-US', {
      minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: grouped,
    }) + (isPct ? '%' : ''))
  }
  if (F === 'DOLLAR') {
    const n = Number(argsT[0]); const d = Number(argsT[1] ?? '2')
    if (!Number.isFinite(n)) return wrap('#VALUE!')
    return wrap('$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }))
  }
  if (F === 'NUMBERVALUE') {
    const dec = argsT[1] ?? '.', grp = argsT[2] ?? ','
    const cleaned = (argsT[0] ?? '').split(grp).join('').replace(dec, '.')
    const n = Number(cleaned)
    return Number.isFinite(n) ? String(n) : wrap('#VALUE!')
  }
  if (F === 'VALUE') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? String(n) : wrap('#VALUE!')
  }
  if (F === 'N') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? String(n) : '0'
  }
  return null
}
