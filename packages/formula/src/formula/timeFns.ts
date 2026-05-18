import { wrap } from './marker'


const DAY_SECONDS = 86400

const parseTime = (s: string): { h: number; m: number; sec: number } | null => {
  const n = Number(s)
  if (Number.isFinite(n)) return secondsToTime(Math.floor(((n % 1) + 1) % 1 * DAY_SECONDS))
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(s.trim())
  return m ? { h: Number(m[1]), m: Number(m[2]), sec: Number(m[3] ?? '0') } : null
}

const secondsToTime = (total: number): { h: number; m: number; sec: number } => {
  const s = ((Math.floor(total) % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS
  return { h: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, sec: s % 60 }
}

const timeSerial = (h: number, m: number, s: number): number =>
  (((h * 3600 + m * 60 + s) % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS / DAY_SECONDS

export function dispatchTime(F: string, argsT: string[]): string | null {
  if (F === 'TIMEVALUE') {
    const t = parseTime(argsT[0]); if (!t) return wrap('#VALUE!')
    return String(timeSerial(t.h, t.m, t.sec))
  }
  if (F === 'HOUR') { const t = parseTime(argsT[0]); return t ? String(t.h) : wrap('#VALUE!') }
  if (F === 'MINUTE') { const t = parseTime(argsT[0]); return t ? String(t.m) : wrap('#VALUE!') }
  if (F === 'SECOND') { const t = parseTime(argsT[0]); return t ? String(t.sec) : wrap('#VALUE!') }
  if (F === 'TIME') {
    const h = Number(argsT[0]) || 0, m = Number(argsT[1]) || 0, s = Number(argsT[2]) || 0
    return String(timeSerial(h, m, s))
  }
  return null
}
