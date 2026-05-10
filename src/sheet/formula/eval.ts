import { A1_RE, FUNC_RE, collectRefs } from './parse'

type Cells = Record<string, string>

const TM = '\x01' // text marker

const numFromCell = (cells: Cells, ref: string, seen: Set<string>): number => {
  const v = evaluate(cells, cells[ref] ?? '', seen)
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const stripText = (s: string) => s.startsWith(TM) && s.endsWith(TM) ? s.slice(1, -1) : s

const argString = (raw: string, cells: Cells, seen: Set<string>): string => {
  const a = raw.trim()
  if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1).replace(/""/g, '"')
  if (/^[A-J]\d+$/.test(a)) return evaluate(cells, cells[a] ?? '', seen)
  return stripText(evaluate(cells, '=' + a, seen))
}

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

const evalArith = (expr: string): unknown => {
  if (!/^[\d+\-*/().\s,<>=!]+$/.test(expr)) throw new Error('bad')
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr})`)()
}

const dispatch = (fn: string, rawArgs: string, cells: Cells, seen: Set<string>): string => {
  const F = fn.toUpperCase()
  if (F === 'SUM' || F === 'AVERAGE' || F === 'MIN' || F === 'MAX' || F === 'COUNT') {
    const nums = collectRefs(rawArgs).map((r) => numFromCell(cells, r, seen))
    if (F === 'SUM') return String(nums.reduce((a, b) => a + b, 0))
    if (F === 'AVERAGE') return String(nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length))
    if (F === 'MIN') return String(Math.min(...nums))
    if (F === 'MAX') return String(Math.max(...nums))
    return String(nums.length)
  }
  const argsT = splitArgs(rawArgs).map((s) => argString(s, cells, seen))
  const wrap = (s: string) => TM + s + TM
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
  if (F === 'IF') return String(argsN[0] ? argsT[1] : argsT[2])
  return '0'
}

function evaluate(cells: Cells, raw: string, seen: Set<string> = new Set()): string {
  if (!raw.startsWith('=')) return raw
  let expr = raw.slice(1)

  let prev = ''
  while (prev !== expr) {
    prev = expr
    expr = expr.replace(FUNC_RE, (_m, fn: string, args: string) => dispatch(fn, args, cells, seen))
  }

  // If text marker survived to top-level, return text
  if (expr.startsWith(TM) && expr.endsWith(TM)) return stripText(expr)

  expr = expr.replace(A1_RE, (_m, c, r) => {
    const ref = `${c}${r}`
    if (seen.has(ref)) return '0'
    seen.add(ref)
    const n = numFromCell(cells, ref, seen)
    seen.delete(ref)
    return String(n)
  })

  try {
    const result = evalArith(expr)
    if (typeof result === 'boolean') return result ? '1' : '0'
    if (typeof result === 'number') {
      return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : '#ERR'
    }
    return String(result)
  } catch {
    return '#ERR'
  }
}

export const evaluateCell = (cells: Cells, raw: string) => evaluate(cells, raw)
