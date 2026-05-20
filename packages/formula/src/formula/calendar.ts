import { pad2 } from '../numeric'
import { wrap } from './marker'

const DAY_MS = 86_400_000
const MAX_CALENDAR_ITERATION_DAYS = 10_000

const fmtUTC = (r: Date) => `${r.getUTCFullYear()}-${pad2(r.getUTCMonth() + 1)}-${pad2(r.getUTCDate())}`
const isSameUtcDate = (d: Date, y: number, m: number, day: number): boolean =>
  d.getUTCFullYear() === y && d.getUTCMonth() === m - 1 && d.getUTCDate() === day

const parseDate = (s: string | undefined): Date | null => {
  if (s === undefined) return null
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1]), month = Number(m[2]), day = Number(m[3])
  const d = new Date(Date.UTC(y, month - 1, day))
  return isNaN(d.getTime()) || !isSameUtcDate(d, y, month, day) ? null : d
}
const daySpan = (a: Date, b: Date): number => Math.floor(Math.abs(b.getTime() - a.getTime()) / DAY_MS)
const isSafeWorkdayCount = (value: number): boolean =>
  Number.isInteger(value) && Math.abs(value) <= MAX_CALENDAR_ITERATION_DAYS

export function dispatchCalendar(F: string, argsT: string[]): string | null {
  if (F === 'WEEKNUM' || F === 'ISOWEEKNUM') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    if (F === 'ISOWEEKNUM') {
      const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const dn = (t.getUTCDay() + 6) % 7
      t.setUTCDate(t.getUTCDate() - dn + 3)
      const j4 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
      return String(1 + Math.round(((t.getTime() - j4.getTime()) / DAY_MS - 3 + ((j4.getUTCDay() + 6) % 7)) / 7))
    }
    const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const days0 = Math.floor((d.getTime() - start.getTime()) / DAY_MS)
    return String(Math.floor((days0 + start.getUTCDay()) / 7) + 1)
  }
  if (F === 'DAYS360') {
    const a = parseDate(argsT[0]), b = parseDate(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const day = (d: Date) => Math.min(30, d.getUTCDate())
    return String(360 * (b.getUTCFullYear() - a.getUTCFullYear()) + 30 * (b.getUTCMonth() - a.getUTCMonth()) + (day(b) - day(a)))
  }
  if (F === 'DATEDIF') {
    const a = parseDate(argsT[0]), b = parseDate(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const unit = (argsT[2] ?? '').toUpperCase()
    if (unit === 'D') return String(Math.floor((b.getTime() - a.getTime()) / DAY_MS))
    if (unit === 'M') return String((b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth()) - (b.getUTCDate() < a.getUTCDate() ? 1 : 0))
    if (unit === 'Y') return String(b.getUTCFullYear() - a.getUTCFullYear() - (b.getUTCMonth() < a.getUTCMonth() || (b.getUTCMonth() === a.getUTCMonth() && b.getUTCDate() < a.getUTCDate()) ? 1 : 0))
    return wrap('#NUM!')
  }
  if (F === 'NETWORKDAYS') {
    const a = parseDate(argsT[0]), b = parseDate(argsT[1])
    if (!a || !b) return wrap('#VALUE!')
    const [start, end] = a <= b ? [a, b] : [b, a]
    if (daySpan(start, end) > MAX_CALENDAR_ITERATION_DAYS) return wrap('#VALUE!')
    let n = 0
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const w = d.getUTCDay()
      if (w !== 0 && w !== 6) n++
    }
    return String(n)
  }
  if (F === 'WORKDAY') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    const n = Number(argsT[1])
    if (!isSafeWorkdayCount(n)) return wrap('#VALUE!')
    let remaining = n
    const step = remaining >= 0 ? 1 : -1
    const cur = new Date(d.getTime())
    while (remaining !== 0) {
      cur.setUTCDate(cur.getUTCDate() + step)
      const w = cur.getUTCDay()
      if (w !== 0 && w !== 6) remaining -= step
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
