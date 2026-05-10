import { wrap } from './marker'

const pad = (n: number) => String(n).padStart(2, '0')
const fmtUTC = (r: Date) => `${r.getUTCFullYear()}-${pad(r.getUTCMonth() + 1)}-${pad(r.getUTCDate())}`
const parseDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return isNaN(d.getTime()) ? null : d
}

export function dispatchCalendar(F: string, argsT: string[]): string | null {
  if (F === 'WEEKNUM' || F === 'ISOWEEKNUM') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    if (F === 'ISOWEEKNUM') {
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const dn = (t.getUTCDay() + 6) % 7
      t.setUTCDate(t.getUTCDate() - dn + 3)
      const j4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
      return String(1 + Math.round(((t.getTime() - j4.getTime()) / 86400000 - 3 + ((j4.getUTCDay() + 6) % 7)) / 7))
    }
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const days0 = Math.floor((d.getTime() - start.getTime()) / 86400000)
    return String(Math.floor((days0 + start.getUTCDay()) / 7) + 1)
  }
  if (F === 'DATEDIF') {
    const a = parseDate(argsT[0]), b = parseDate(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const unit = (argsT[2] ?? '').toUpperCase()
    if (unit === 'D') return String(Math.floor((b.getTime() - a.getTime()) / 86400000))
    if (unit === 'M') return String((b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) - (b.getUTCDate() < a.getUTCDate() ? 1 : 0))
    if (unit === 'Y') return String(b.getUTCFullYear() - a.getUTCFullYear() - (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate()) ? 1 : 0))
    return wrap('#NUM!')
  }
  if (F === 'NETWORKDAYS') {
    const a = parseDate(argsT[0]), b = parseDate(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const [start, end] = a <= b ? [a, b] : [b, a]
    let n = 0
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const w = d.getUTCDay()
      if (w !== 0 && w !== 6) n++
    }
    return String(n)
  }
  if (F === 'WORKDAY') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    let n = Number(argsT[1]); const step = n >= 0 ? 1 : -1
    const cur = new Date(d.getTime())
    while (n !== 0) {
      cur.setUTCDate(cur.getUTCDate() + step)
      const w = cur.getUTCDay()
      if (w !== 0 && w !== 6) n -= step
    }
    return wrap(fmtUTC(cur))
  }
  if (F === 'EDATE') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    return wrap(fmtUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + Number(argsT[1]), d.getUTCDate()))))
  }
  if (F === 'EOMONTH') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    return wrap(fmtUTC(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + Number(argsT[1]) + 1, 0))))
  }
  return null
}
