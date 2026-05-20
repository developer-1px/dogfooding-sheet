import { smartReturn, wrap } from './marker'

const MAX_ROUND_DIGITS = 100

const valueError = (): string => wrap('#VALUE!')
const numError = (): string => wrap('#NUM!')
const divZeroError = (): string => wrap('#DIV/0!')

const hasFiniteArgs = (argsN: number[], required: number): boolean =>
  argsN.length >= required && argsN.slice(0, required).every(Number.isFinite)

const allFiniteArgs = (argsN: number[]): boolean =>
  argsN.every(Number.isFinite)

const finiteResult = (value: number): string =>
  Number.isFinite(value) ? String(value) : numError()

const boundedRoundDigits = (value: number): number | null =>
  Number.isInteger(value) && Math.abs(value) <= MAX_ROUND_DIGITS ? value : null

const roundingArgs = (argsN: number[]): [number, number] | null => {
  if (!hasFiniteArgs(argsN, 1)) return null
  const digits = boundedRoundDigits(argsN[1] ?? 0)
  return digits === null ? null : [argsN[0], digits]
}

const roundHalfAwayFromZero = (n: number, digits = 0): number => {
  const m = 10 ** digits
  return Math.sign(n || 1) * Math.round(Math.abs(n) * m) / m
}

export function dispatchMath(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'ROUND') { const args = roundingArgs(argsN); return args ? finiteResult(roundHalfAwayFromZero(args[0], args[1])) : valueError() }
  if (F === 'ABS') return hasFiniteArgs(argsN, 1) ? String(Math.abs(argsN[0])) : valueError()
  if (F === 'FLOOR') {
    if (!hasFiniteArgs(argsN, 1) || (argsN[1] !== undefined && !Number.isFinite(argsN[1]))) return valueError()
    const [n, s = 1] = argsN
    return s === 0 ? '0' : finiteResult(Math.floor(n / s) * s)
  }
  if (F === 'CEIL' || F === 'CEILING') {
    if (!hasFiniteArgs(argsN, 1) || (argsN[1] !== undefined && !Number.isFinite(argsN[1]))) return valueError()
    const [n, s = 1] = argsN
    return s === 0 ? '0' : finiteResult(Math.ceil(n / s) * s)
  }
  if (F === 'SQRT') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sqrt(argsN[0])) : valueError()
  if (F === 'CBRT') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.cbrt(argsN[0])) : valueError()
  if (F === 'POWER') return hasFiniteArgs(argsN, 2) ? finiteResult(Math.pow(argsN[0], argsN[1])) : valueError()
  if (F === 'MOD') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [n, d] = argsN
    return d === 0 ? divZeroError() : finiteResult(n - d * Math.floor(n / d))
  }
  if (F === 'INT') return hasFiniteArgs(argsN, 1) ? String(Math.floor(argsN[0])) : valueError()
  if (F === 'LN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.log(argsN[0])) : valueError()
  if (F === 'LOG') {
    if (!hasFiniteArgs(argsN, 1) || (argsN[1] !== undefined && !Number.isFinite(argsN[1]))) return valueError()
    return finiteResult(argsN.length > 1 ? Math.log(argsN[0]) / Math.log(argsN[1]) : Math.log10(argsN[0]))
  }
  if (F === 'LOG10') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.log10(argsN[0])) : valueError()
  if (F === 'LOG2') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.log2(argsN[0])) : valueError()
  if (F === 'MAGNITUDE') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const n = Math.abs(argsN[0])
    return finiteResult(n === 0 ? 0 : Math.floor(Math.log10(n)))
  }
  if (F === 'EXP') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.exp(argsN[0])) : valueError()
  if (F === 'EXP10') return hasFiniteArgs(argsN, 1) ? finiteResult(10 ** argsN[0]) : valueError()
  if (F === 'EXP2') return hasFiniteArgs(argsN, 1) ? finiteResult(2 ** argsN[0]) : valueError()
  if (F === 'EXPM1') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.expm1(argsN[0])) : valueError()
  if (F === 'LOG1P') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.log1p(argsN[0])) : valueError()
  if (F === 'ROUNDUP') {
    const args = roundingArgs(argsN); if (!args) return valueError()
    const [n, d] = args; const m = 10 ** d
    return finiteResult(Math.ceil(Math.abs(n) * m) / m * Math.sign(n || 1))
  }
  if (F === 'ROUNDDOWN') {
    const args = roundingArgs(argsN); if (!args) return valueError()
    const [n, d] = args; const m = 10 ** d
    return finiteResult(Math.trunc(n * m) / m)
  }
  if (F === 'IF') {
    const value = argsN[0] ? (argsT[1] ?? '') : (argsT[2] ?? '')
    return value === '' ? wrap('') : smartReturn(value)
  }
  if (F === 'TRUNC') {
    const args = roundingArgs(argsN); if (!args) return valueError()
    const [n, d] = args; const m = 10 ** d
    return finiteResult(Math.trunc(n * m) / m)
  }
  if (F === 'SIGN') return hasFiniteArgs(argsN, 1) ? String(Math.sign(argsN[0])) : valueError()
  if (F === 'SIGNCHAR') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const s = Math.sign(argsN[0]); return wrap(s > 0 ? '+' : s < 0 ? '-' : '0')
  }
  if (F === 'PI') return String(Math.PI)
  if (F === 'LOGISTIC') return hasFiniteArgs(argsN, 1) ? finiteResult(1 / (1 + Math.exp(-argsN[0]))) : valueError()
  if (F === 'RELU') return hasFiniteArgs(argsN, 1) ? String(Math.max(0, argsN[0])) : valueError()
  if (F === 'TAU') return String(Math.PI * 2)
  if (F === 'E') return String(Math.E)
  if (F === 'EVEN') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const n = argsN[0]; const a = Math.ceil(Math.abs(n) / 2) * 2
    return finiteResult(n < 0 ? -a : a)
  }
  if (F === 'ODD') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const n = argsN[0]; const a = Math.abs(n); const r = a % 2 === 0 ? a + 1 : Math.ceil(a) | 1
    return finiteResult(n < 0 ? -r : r)
  }
  if (F === 'MAPRANGE') {
    if (!hasFiniteArgs(argsN, 5)) return valueError()
    const [v, a, b, c, d] = argsN
    return b === a ? divZeroError() : finiteResult(c + (d - c) * (v - a) / (b - a))
  }
  if (F === 'HYPOT') return allFiniteArgs(argsN) ? finiteResult(Math.hypot(...argsN)) : valueError()
  if (F === 'MEDIAN3') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const s = argsN.slice(0, 3).sort((a, b) => a - b); return String(s[1])
  }
  if (F === 'INVLERP') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const [v, a, b] = argsN; return b === a ? divZeroError() : finiteResult((v - a) / (b - a))
  }
  if (F === 'LERP') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const [a, b, t] = argsN; return finiteResult(a + (b - a) * t)
  }
  if (F === 'CLAMP') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const [v, lo, hi] = argsN; return finiteResult(Math.min(hi, Math.max(lo, v)))
  }
  if (F === 'RAND') return String(Math.random())
  if (F === 'COINFLIP') return Math.random() < 0.5 ? '1' : '0'
  if (F === 'RANDNORM') {
    if (!allFiniteArgs(argsN)) return valueError()
    const [mu = 0, sd = 1] = argsN
    const u = Math.max(1e-12, Math.random()), v = Math.random()
    return finiteResult(mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))
  }
  if (F === 'RANDFLOAT') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [lo, hi] = argsN; return finiteResult(lo + Math.random() * (hi - lo))
  }
  if (F === 'RANDBETWEEN') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [lo, hi] = argsN
    return hi < lo ? numError() : finiteResult(Math.floor(Math.random() * (hi - lo + 1)) + lo)
  }
  if (F === 'GCD') {
    if (argsN.length === 0 || !allFiniteArgs(argsN)) return valueError()
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return String(argsN.map((n) => Math.abs(Math.floor(n))).reduce((a, b) => g(a, b)))
  }
  if (F === 'LCM') {
    if (argsN.length === 0 || !allFiniteArgs(argsN)) return valueError()
    const values = argsN.map((n) => Math.abs(Math.floor(n)))
    if (values.some((n) => n === 0)) return '0'
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return finiteResult(values.reduce((a, b) => (a * b) / g(a, b)))
  }
  if (F === 'MROUND') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [n, m] = argsN
    if (m === 0) return '0'
    if (Math.sign(n) !== 0 && Math.sign(m) !== 0 && Math.sign(n) !== Math.sign(m)) return numError()
    return finiteResult(Math.sign(n || 1) * Math.round(Math.abs(n) / Math.abs(m)) * Math.abs(m))
  }
  if (F === 'QUOTIENT') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [n, d] = argsN; return d === 0 ? divZeroError() : finiteResult(Math.trunc(n / d))
  }
  if (F === 'SQRTPI') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sqrt(argsN[0] * Math.PI)) : valueError()
  if (F === 'SIN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sin(argsN[0])) : valueError()
  if (F === 'COS') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.cos(argsN[0])) : valueError()
  if (F === 'TAN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.tan(argsN[0])) : valueError()
  if (F === 'ASIN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.asin(argsN[0])) : valueError()
  if (F === 'ACOS') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.acos(argsN[0])) : valueError()
  if (F === 'ATAN') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.atan(argsN[0])) : valueError()
  if (F === 'ATAN2') return hasFiniteArgs(argsN, 2) ? finiteResult(Math.atan2(argsN[0], argsN[1])) : valueError()
  if (F === 'SINH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.sinh(argsN[0])) : valueError()
  if (F === 'COSH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.cosh(argsN[0])) : valueError()
  if (F === 'TANH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.tanh(argsN[0])) : valueError()
  if (F === 'ASINH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.asinh(argsN[0])) : valueError()
  if (F === 'ACOSH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.acosh(argsN[0])) : valueError()
  if (F === 'ATANH') return hasFiniteArgs(argsN, 1) ? finiteResult(Math.atanh(argsN[0])) : valueError()
  if (F === 'ACOT') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    return finiteResult(argsN[0] === 0 ? Math.PI / 2 : Math.atan(1 / argsN[0]))
  }
  if (F === 'ACOTH') return hasFiniteArgs(argsN, 1) ? finiteResult(0.5 * Math.log((argsN[0] + 1) / (argsN[0] - 1))) : valueError()
  if (F === 'SEC') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.cos(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'CSC') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.sin(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'COT') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.tan(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'SECH') return hasFiniteArgs(argsN, 1) ? finiteResult(1 / Math.cosh(argsN[0])) : valueError()
  if (F === 'CSCH') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.sinh(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'COTH') {
    if (!hasFiniteArgs(argsN, 1)) return valueError()
    const d = Math.tanh(argsN[0]); return d === 0 ? divZeroError() : finiteResult(1 / d)
  }
  if (F === 'DEGREES') return hasFiniteArgs(argsN, 1) ? finiteResult(argsN[0] * 180 / Math.PI) : valueError()
  if (F === 'RADIANS') return hasFiniteArgs(argsN, 1) ? finiteResult(argsN[0] * Math.PI / 180) : valueError()
  return null
}
