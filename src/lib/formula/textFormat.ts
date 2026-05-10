import { wrap } from './marker'
import { dispatchColor } from './colorFns'
import { dispatchHumanFmt } from './humanFmt'

export function dispatchTextFormat(F: string, argsT: string[]): string | null {
  const col = dispatchColor(F, argsT); if (col !== null) return col
  const human = dispatchHumanFmt(F, argsT); if (human !== null) return human
  if (F === 'LANG') return wrap(typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  if (F === 'TIMEZONE') { try { return wrap(Intl.DateTimeFormat().resolvedOptions().timeZone) } catch { return wrap('UTC') } }
  if (F === 'STRINGIFY') return wrap(JSON.stringify(argsT.length === 1 ? argsT[0] : argsT))
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
