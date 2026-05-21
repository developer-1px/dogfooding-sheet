import { RangeLimitError } from './parse'

export const MAX_ARITHMETIC_DEPTH = 512

export class FormulaLimitError extends Error {}

export const isFormulaLimitError = (error: unknown): boolean =>
  error instanceof FormulaLimitError || error instanceof RangeLimitError

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

export const evalArith = (expr: string): number =>
  new ArithmeticParser(expr).parse()
