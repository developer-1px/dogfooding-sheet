import type { Cells } from '../a1'
import { A1_RE, FUNC_RE } from './parse'
import { dispatch, stripText, TM } from './dispatch'


const numFromCellFactory = (cells: Cells, seen: Set<string>) => (ref: string): number => {
  const v = evaluate(cells, cells[ref] ?? '', seen)
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const evalArith = (expr: string): unknown => {
  if (!/^[\d+\-*/().\s,<>=!]+$/.test(expr)) throw new Error('bad')
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${expr})`)()
}

function evaluate(cells: Cells, raw: string, seen: Set<string> = new Set()): string {
  if (!raw.startsWith('=')) return raw
  let expr = raw.slice(1)
  const numFromCell = numFromCellFactory(cells, seen)
  const ctx = { cells, seen, numFromCell, evalRaw: (r: string) => evaluate(cells, r, seen) }

  let prev = ''
  while (prev !== expr) {
    prev = expr
    expr = expr.replace(FUNC_RE, (_m, fn: string, args: string) => dispatch(fn, args, ctx))
  }

  if (expr.startsWith(TM) && expr.endsWith(TM)) return stripText(expr)

  expr = expr.replace(A1_RE, (_m, c, r) => {
    const ref = `${c}${r}`
    if (seen.has(ref)) return '0'
    seen.add(ref)
    const n = numFromCell(ref)
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
