type Cells = Record<string, string>

const A1_RE = /([A-J])(\d+)/g
const RANGE_RE = /([A-J])(\d+):([A-J])(\d+)/g
const FUNC_NAMES = 'SUM|AVERAGE|MIN|MAX|COUNT|ROUND|ABS|FLOOR|CEIL|SQRT|IF'
const FUNC_RE = new RegExp(`(${FUNC_NAMES})\\(([^()]*)\\)`, 'gi')

const expandRange = (a: string, ar: string, b: string, br: string): string[] => {
  const c1 = a.charCodeAt(0), c2 = b.charCodeAt(0)
  const r1 = Number(ar), r2 = Number(br)
  const refs: string[] = []
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      refs.push(String.fromCharCode(c) + r)
    }
  }
  return refs
}

const collectRefs = (args: string): string[] => {
  const refs: string[] = []
  args.replace(RANGE_RE, (_x, a, ar, b, br) => {
    refs.push(...expandRange(a, ar, b, br))
    return ''
  })
  args.replace(A1_RE, (_x, c, r) => {
    const ref = `${c}${r}`
    if (!refs.includes(ref)) refs.push(ref)
    return ''
  })
  return refs
}

const numFromCell = (cells: Cells, ref: string, seen: Set<string>): number => {
  const v = evaluate(cells, cells[ref] ?? '', seen)
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const evalArith = (expr: string): number => {
  if (!/^[\d+\-*/().\s,<>=!]+$/.test(expr)) throw new Error('bad')
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr})`)()
}

const dispatch = (fn: string, refNums: number[], rawArgs: string, cells: Cells, seen: Set<string>): string => {
  const F = fn.toUpperCase()
  if (F === 'SUM') return String(refNums.reduce((a, b) => a + b, 0))
  if (F === 'AVERAGE') return String(refNums.reduce((a, b) => a + b, 0) / Math.max(1, refNums.length))
  if (F === 'MIN') return String(Math.min(...refNums))
  if (F === 'MAX') return String(Math.max(...refNums))
  if (F === 'COUNT') return String(refNums.length)
  const args = rawArgs.split(',').map((s) => Number(evaluate(cells, s.trim().startsWith('=') ? s : '=' + s, seen)))
  if (F === 'ROUND') { const [n, d = 0] = args; const m = 10 ** d; return String(Math.round(n * m) / m) }
  if (F === 'ABS') return String(Math.abs(args[0]))
  if (F === 'FLOOR') return String(Math.floor(args[0]))
  if (F === 'CEIL') return String(Math.ceil(args[0]))
  if (F === 'SQRT') return String(Math.sqrt(args[0]))
  if (F === 'IF') return String(args[0] ? args[1] : args[2])
  return '0'
}

function evaluate(cells: Cells, raw: string, seen: Set<string> = new Set()): string {
  if (!raw.startsWith('=')) return raw
  let expr = raw.slice(1)

  let prev = ''
  while (prev !== expr) {
    prev = expr
    expr = expr.replace(FUNC_RE, (_m, fn: string, args: string) => {
      const refNums = collectRefs(args).map((r) => numFromCell(cells, r, seen))
      return dispatch(fn, refNums, args, cells, seen)
    })
  }

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
    if (typeof result === 'number') {
      return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : '#ERR'
    }
    return String(result)
  } catch {
    return '#ERR'
  }
}

export const evaluateCell = (cells: Cells, raw: string) => evaluate(cells, raw)
