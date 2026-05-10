import { wrap } from './marker'

const pad = (n: number) => String(n).padStart(2, '0')

const parseTime = (s: string): { h: number; m: number; sec: number } | null => {
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(s.trim())
  return m ? { h: Number(m[1]), m: Number(m[2]), sec: Number(m[3] ?? '0') } : null
}

export function dispatchTime(F: string, argsT: string[]): string | null {
  if (F === 'HOUR') { const t = parseTime(argsT[0]); return t ? String(t.h) : wrap('#VALUE!') }
  if (F === 'MINUTE') { const t = parseTime(argsT[0]); return t ? String(t.m) : wrap('#VALUE!') }
  if (F === 'SECOND') { const t = parseTime(argsT[0]); return t ? String(t.sec) : wrap('#VALUE!') }
  if (F === 'TIME') {
    const h = Number(argsT[0]) || 0, m = Number(argsT[1]) || 0, s = Number(argsT[2]) || 0
    return wrap(`${pad(h)}:${pad(m)}:${pad(s)}`)
  }
  return null
}
