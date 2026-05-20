import type { Cells } from '../a1'
import { ABS_A1_RE, FUNC_RE } from './parse'
import { dispatch, stripText, TM } from './dispatch'
import { coerceNumber } from './coerce'


const numFromCellFactory = (cells: Cells, seen: Set<string>) => (ref: string): number => {
  const v = evaluate(cells, cells[ref] ?? '', seen)
  const n = coerceNumber(v)
  return Number.isFinite(n) ? n : 0
}

class ArithmeticParser {
  private i = 0
  private readonly input: string

  constructor(input: string) {
    this.input = input
  }

  parse(): number {
    const value = this.comparison()
    this.spaces()
    if (this.i !== this.input.length) throw new Error('bad')
    return value
  }

  private comparison(): number {
    let left = this.additive()
    for (;;) {
      const op = this.matchOp(['<=', '>=', '<>', '!=', '=', '<', '>'])
      if (!op) return left
      const right = this.additive()
      if (op === '<=') left = left <= right ? 1 : 0
      else if (op === '>=') left = left >= right ? 1 : 0
      else if (op === '<>' || op === '!=') left = left !== right ? 1 : 0
      else if (op === '=') left = left === right ? 1 : 0
      else if (op === '<') left = left < right ? 1 : 0
      else left = left > right ? 1 : 0
    }
  }

  private additive(): number {
    let left = this.multiplicative()
    for (;;) {
      if (this.match('+')) left += this.multiplicative()
      else if (this.match('-')) left -= this.multiplicative()
      else return left
    }
  }

  private multiplicative(): number {
    let left = this.unary()
    for (;;) {
      if (this.match('*')) left *= this.unary()
      else if (this.match('/')) left /= this.unary()
      else return left
    }
  }

  private unary(): number {
    if (this.match('+')) return this.unary()
    if (this.match('-')) return -this.unary()
    return this.primary()
  }

  private primary(): number {
    if (this.match('(')) {
      const value = this.comparison()
      if (!this.match(')')) throw new Error('bad')
      return value
    }
    return this.number()
  }

  private number(): number {
    this.spaces()
    const start = this.i
    while (/\d/.test(this.peek())) this.i++
    if (this.peek() === '.') {
      this.i++
      while (/\d/.test(this.peek())) this.i++
    }
    if (start === this.i || this.input.slice(start, this.i) === '.') throw new Error('bad')
    return Number(this.input.slice(start, this.i))
  }

  private matchOp(ops: readonly string[]): string | null {
    this.spaces()
    for (const op of ops) {
      if (this.input.startsWith(op, this.i)) {
        this.i += op.length
        return op
      }
    }
    return null
  }

  private match(token: string): boolean {
    this.spaces()
    if (!this.input.startsWith(token, this.i)) return false
    this.i += token.length
    return true
  }

  private spaces() {
    while (/\s/.test(this.peek())) this.i++
  }

  private peek(): string {
    return this.input[this.i] ?? ''
  }
}

const evalArith = (expr: string): number => {
  return new ArithmeticParser(expr).parse()
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

  expr = expr.replace(ABS_A1_RE, (_m, _absCol, c, _absRow, r) => {
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
      return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : '#DIV/0!'
    }
    return String(result)
  } catch {
    return '#ERR'
  }
}

export const evaluateCell = (cells: Cells, raw: string) => evaluate(cells, raw)
