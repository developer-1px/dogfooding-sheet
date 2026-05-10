import { wrap } from './marker'

const pad = (n: number) => String(n).padStart(2, '0')

export const today = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const now = (): string => {
  const d = new Date()
  return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const date = (y: number, m: number, d: number): string =>
  `${y}-${pad(m)}-${pad(d)}`

const parseDate = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return isNaN(d.getTime()) ? null : d
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
  if (F === 'TODAY') return wrap(today())
  if (F === 'NOW') return wrap(now())
  if (F === 'DATE') return wrap(date(Number(argsT[0]), Number(argsT[1]), Number(argsT[2])))
  if (F === 'YEAR') return String(year(argsT[0]))
  if (F === 'MONTH') return String(month(argsT[0]))
  if (F === 'DAY') return String(day(argsT[0]))
  if (F === 'DAYS') return String(days(argsT[0], argsT[1]))
  if (F === 'DATEVALUE') {
    const d = parseDate(argsT[0]); if (!d) return wrap('#VALUE!')
    // Sheets epoch: 1899-12-30
    return String(Math.round((d.getTime() - Date.UTC(1899, 11, 30)) / 86400000))
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
