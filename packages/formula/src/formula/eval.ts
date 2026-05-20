import { parseA1, type Cells } from '../a1'
import { ABS_A1_RE, FORMULA_FUNCTION_NAMES, RangeLimitError } from './parse'
import { dispatch, stripText, TM } from './dispatch'
import { coerceNumber } from './coerce'
import type { Ctx, EvalCell } from './args'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

const CYCLE_ERROR = '#CYCLE!'
const VALUE_ERROR = '#VALUE!'
const LAZY_FUNCTIONS = new Set(['IF', 'IFERROR', 'IFNA', 'CHOOSE', 'IFEMPTY', 'COALESCE', 'IFS', 'SWITCH'])
export const MAX_FORMULA_LENGTH = MAX_GENERATED_TEXT_LENGTH
export const MAX_ARITHMETIC_DEPTH = 512

class FormulaCycleError extends Error {}
class FormulaLimitError extends Error {}

const isFormulaLimitError = (error: unknown): boolean =>
  error instanceof FormulaLimitError || error instanceof RangeLimitError

const evalCellFactory = (cells: Cells, seen: Set<string>): EvalCell => (ref: string): string => {
  if (seen.has(ref)) return CYCLE_ERROR
  seen.add(ref)
  try {
    return evaluate(cells, cells[ref] ?? '', seen)
  } catch (error) {
    if (error instanceof FormulaCycleError) return CYCLE_ERROR
    if (isFormulaLimitError(error)) return VALUE_ERROR
    throw error
  } finally {
    seen.delete(ref)
  }
}

const numFromCellFactory = (evalCell: EvalCell) => (ref: string): number => {
  const v = evalCell(ref)
  if (v === CYCLE_ERROR) throw new FormulaCycleError()
  const n = coerceNumber(v)
  return Number.isFinite(n) ? n : 0
}

class ArithmeticParser {
  private i = 0
  private depth = 0
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
    if (this.match('+')) return this.withDepth(() => this.unary())
    if (this.match('-')) return this.withDepth(() => -this.unary())
    return this.primary()
  }

  private primary(): number {
    if (this.match('(')) {
      return this.withDepth(() => {
        const value = this.comparison()
        if (!this.match(')')) throw new Error('bad')
        return value
      })
    }
    return this.number()
  }

  private withDepth<T>(fn: () => T): T {
    if (this.depth >= MAX_ARITHMETIC_DEPTH) throw new FormulaLimitError()
    this.depth++
    try {
      return fn()
    } finally {
      this.depth--
    }
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

const matchingParen = (expr: string, open: number): number => {
  let depth = 0
  let inQuote = false
  for (let i = open; i < expr.length; i++) {
    const ch = expr[i]
    if (ch === '"' && inQuote && expr[i + 1] === '"') {
      i++
    } else if (ch === '"') {
      inQuote = !inQuote
    } else if (!inQuote && ch === '(') {
      depth++
    } else if (!inQuote && ch === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

const isFunctionNameStart = (ch: string | undefined): boolean =>
  ch !== undefined && /[A-Za-z_]/.test(ch)

const isFunctionNamePart = (ch: string | undefined): boolean =>
  ch !== undefined && /[A-Za-z0-9_]/.test(ch)

const replaceFunctionCall = (expr: string, c: Ctx, lazyOnly = false): string => {
  let inQuote = false
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (ch === '"' && inQuote && expr[i + 1] === '"') {
      i++
      continue
    }
    if (ch === '"') {
      inQuote = !inQuote
      continue
    }
    if (inQuote || !isFunctionNameStart(ch)) continue

    const start = i
    while (isFunctionNamePart(expr[i])) i++
    const fn = expr.slice(start, i).toUpperCase()
    if (expr[i] !== '(' || !FORMULA_FUNCTION_NAMES.has(fn)) continue
    if (lazyOnly && !LAZY_FUNCTIONS.has(fn)) continue

    const close = matchingParen(expr, i)
    if (close < 0) return expr
    const args = expr.slice(i + 1, close)
    return expr.slice(0, start) + dispatch(fn, args, c) + expr.slice(close + 1)
  }
  return expr
}

const createContext = (cells: Cells, seen: Set<string>) => {
  const evalCell = evalCellFactory(cells, seen)
  const numFromCell = numFromCellFactory(evalCell)
  return {
    cells,
    seen,
    numFromCell,
    evalCell,
    evalRaw: (r: string) => {
      try {
        return evaluate(cells, r, seen)
      } catch (error) {
        if (error instanceof FormulaCycleError) return CYCLE_ERROR
        if (isFormulaLimitError(error)) return VALUE_ERROR
        throw error
      }
    },
  }
}

function evaluate(cells: Cells, raw: string, seen: Set<string> = new Set()): string {
  if (!raw.startsWith('=')) return raw
  if (raw.length > MAX_FORMULA_LENGTH) return VALUE_ERROR
  let expr = raw.slice(1)
  const ctx = createContext(cells, seen)

  let prev = ''
  while (prev !== expr) {
    prev = expr
    expr = replaceFunctionCall(expr, ctx, true)
    expr = replaceFunctionCall(expr, ctx)
  }

  if (expr.startsWith(TM) && expr.endsWith(TM)) return stripText(expr)

  expr = expr.replace(ABS_A1_RE, (_m, _absCol, c, _absRow, r) => {
    const ref = `${c}${r}`
    if (!parseA1(ref)) throw new FormulaLimitError()
    return String(ctx.numFromCell(ref))
  })

  try {
    const result = evalArith(expr)
    if (typeof result === 'boolean') return result ? '1' : '0'
    if (typeof result === 'number') {
      return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : '#DIV/0!'
    }
    return String(result)
  } catch (error) {
    if (isFormulaLimitError(error)) return VALUE_ERROR
    return '#ERR'
  }
}

export const evaluateCell = (cells: Cells, raw: string) => {
  try {
    return evaluate(cells, raw)
  } catch (error) {
    if (error instanceof FormulaCycleError) return CYCLE_ERROR
    if (isFormulaLimitError(error)) return VALUE_ERROR
    return '#ERR'
  }
}
