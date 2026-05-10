import { collectRefs } from './parse'
import { today, now, date, year, month, day, days } from './dateFns'

type Cells = Record<string, string>

export const TM = '\x01'

export const stripText = (s: string) => s.startsWith(TM) && s.endsWith(TM) ? s.slice(1, -1) : s

const wrap = (s: string) => TM + s + TM

const splitArgs = (s: string): string[] => {
  const out: string[] = []
  let buf = ''
  let inQ = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '"') { inQ = !inQ; buf += ch }
    else if (ch === ',' && !inQ) { out.push(buf); buf = '' }
    else buf += ch
  }
  if (buf) out.push(buf)
  return out
}

export interface Ctx {
  cells: Cells
  seen: Set<string>
  numFromCell: (ref: string) => number
  evalRaw: (raw: string) => string
}

const argString = (raw: string, c: Ctx): string => {
  const a = raw.trim()
  if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1).replace(/""/g, '"')
  if (/^[A-J]\d+$/.test(a)) return c.evalRaw(c.cells[a] ?? '')
  return stripText(c.evalRaw('=' + a))
}

export function dispatch(fn: string, rawArgs: string, c: Ctx): string {
  const F = fn.toUpperCase()
  if (F === 'SUM' || F === 'AVERAGE' || F === 'MIN' || F === 'MAX' || F === 'COUNT') {
    const nums = collectRefs(rawArgs).map(c.numFromCell)
    if (F === 'SUM') return String(nums.reduce((a, b) => a + b, 0))
    if (F === 'AVERAGE') return String(nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length))
    if (F === 'MIN') return String(Math.min(...nums))
    if (F === 'MAX') return String(Math.max(...nums))
    return String(nums.length)
  }
  const argsT = splitArgs(rawArgs).map((s) => argString(s, c))
  if (F === 'TODAY') return wrap(today())
  if (F === 'NOW') return wrap(now())
  if (F === 'DATE') return wrap(date(Number(argsT[0]), Number(argsT[1]), Number(argsT[2])))
  if (F === 'YEAR') return String(year(argsT[0]))
  if (F === 'MONTH') return String(month(argsT[0]))
  if (F === 'DAY') return String(day(argsT[0]))
  if (F === 'DAYS') return String(days(argsT[0], argsT[1]))
  if (F === 'CONCAT') return wrap(argsT.join(''))
  if (F === 'LEN') return String(argsT[0].length)
  if (F === 'UPPER') return wrap(argsT[0].toUpperCase())
  if (F === 'LOWER') return wrap(argsT[0].toLowerCase())
  if (F === 'LEFT') return wrap(argsT[0].slice(0, Number(argsT[1] ?? '1')))
  if (F === 'RIGHT') return wrap(argsT[0].slice(-Number(argsT[1] ?? '1')))
  if (F === 'MID') return wrap(argsT[0].slice(Number(argsT[1]) - 1, Number(argsT[1]) - 1 + Number(argsT[2])))
  if (F === 'TRIM') return wrap(argsT[0].trim())
  const argsN = argsT.map(Number)
  if (F === 'ROUND') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.round(n * m) / m) }
  if (F === 'ABS') return String(Math.abs(argsN[0]))
  if (F === 'FLOOR') return String(Math.floor(argsN[0]))
  if (F === 'CEIL') return String(Math.ceil(argsN[0]))
  if (F === 'SQRT') return String(Math.sqrt(argsN[0]))
  if (F === 'POWER') return String(Math.pow(argsN[0], argsN[1]))
  if (F === 'MOD') return String(argsN[0] % argsN[1])
  if (F === 'IF') return String(argsN[0] ? argsT[1] : argsT[2])
  return '0'
}
