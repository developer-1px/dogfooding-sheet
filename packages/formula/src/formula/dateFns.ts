import { pad2 } from '../numeric'
import { wrap } from './marker'


export const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const now = (): string => {
  const d = new Date()
  return `${today()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const SHEET_EPOCH_UTC = Date.UTC(1899, 11, 30)
const DAY_MS = 86400000

const fmtUTC = (d: Date): string =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`

const isSameUtcDate = (d: Date, y: number, m: number, day: number): boolean =>
  d.getUTCFullYear() === y && d.getUTCMonth() === m - 1 && d.getUTCDate() === day

export const date = (y: number, m: number, d: number): string => {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return isNaN(dt.getTime()) ? '#VALUE!' : fmtUTC(dt)
}

const parseDate = (s: string | undefined): Date | null => {
  if (s === undefined) return null
  const n = Number(s)
  if (Number.isFinite(n)) {
    const d = new Date(SHEET_EPOCH_UTC + n * DAY_MS)
    return isNaN(d.getTime()) ? null : d
  }
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s.trim())
  if (!m) return null
  const y = Number(m[1]), month = Number(m[2]), day = Number(m[3])
  const d = new Date(Date.UTC(y, month - 1, day))
  return isNaN(d.getTime()) || !isSameUtcDate(d, y, month, day) ? null : d
}

export const year = (s: string) => parseDate(s)?.getUTCFullYear() ?? NaN
export const month = (s: string) => (parseDate(s)?.getUTCMonth() ?? -1) + 1 || NaN
export const day = (s: string) => parseDate(s)?.getUTCDate() ?? NaN

export const days = (end: string, start: string): number => {
  const a = parseDate(start), b = parseDate(end)
  if (!a || !b) return NaN
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function dispatchDate(F: string, argsT: string[]): string | null {
  if (F === 'EPOCH') return String(Math.floor(Date.now() / 1000))
  if (F === 'TODAY') return wrap(today())
  if (F === 'NOW') return wrap(now())
  if (F === 'DATE') return wrap(date(Number(argsT[0]), Number(argsT[1]), Number(argsT[2])))
  if (F === 'YEAR') { const d = parseDate(argsT[0]); return d ? String(d.getUTCFullYear()) : wrap('#VALUE!') }
  if (F === 'MONTH') { const d = parseDate(argsT[0]); return d ? String(d.getUTCMonth() + 1) : wrap('#VALUE!') }
  if (F === 'DAY') { const d = parseDate(argsT[0]); return d ? String(d.getUTCDate()) : wrap('#VALUE!') }
  if (F === 'DAYS') { const value = days(argsT[0], argsT[1]); return Number.isFinite(value) ? String(value) : wrap('#VALUE!') }
  if (F === 'DATEVALUE') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    // Sheets epoch: 1899-12-30
    return String(Math.round((d.getTime() - SHEET_EPOCH_UTC) / DAY_MS))
  }
  if (F === 'WEEKDAY') {
    const d = parseDate(argsT[0])
    if (!d) return wrap('#VALUE!')
    const type = Number(argsT[1] ?? '1')
    const w = d.getUTCDay()
    if (type === 2) return String(((w + 6) % 7) + 1)
    if (type === 3) return String((w + 6) % 7)
    return String(w + 1)
  }
  return null
}
