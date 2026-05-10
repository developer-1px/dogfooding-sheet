import { wrap } from './marker'

export function dispatchMath(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'ROUND') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.round(n * m) / m) }
  if (F === 'ABS') return String(Math.abs(argsN[0]))
  if (F === 'FLOOR') { const [n, s = 1] = argsN; return s === 0 ? '0' : String(Math.floor(n / s) * s) }
  if (F === 'CEIL' || F === 'CEILING') { const [n, s = 1] = argsN; return s === 0 ? '0' : String(Math.ceil(n / s) * s) }
  if (F === 'SQRT') return String(Math.sqrt(argsN[0]))
  if (F === 'CBRT') return String(Math.cbrt(argsN[0]))
  if (F === 'POWER') return String(Math.pow(argsN[0], argsN[1]))
  if (F === 'MOD') return String(argsN[0] % argsN[1])
  if (F === 'INT') return String(Math.trunc(argsN[0]))
  if (F === 'LN') return String(Math.log(argsN[0]))
  if (F === 'LOG') return String(argsN.length > 1 ? Math.log(argsN[0]) / Math.log(argsN[1]) : Math.log10(argsN[0]))
  if (F === 'LOG10') return String(Math.log10(argsN[0]))
  if (F === 'LOG2') return String(Math.log2(argsN[0]))
  if (F === 'EXP') return String(Math.exp(argsN[0]))
  if (F === 'EXP10') return String(10 ** argsN[0])
  if (F === 'EXP2') return String(2 ** argsN[0])
  if (F === 'EXPM1') return String(Math.expm1(argsN[0]))
  if (F === 'LOG1P') return String(Math.log1p(argsN[0]))
  if (F === 'ROUNDUP') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.ceil(Math.abs(n) * m) / m * Math.sign(n || 1)) }
  if (F === 'ROUNDDOWN') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.trunc(n * m) / m) }
  if (F === 'IF') return String(argsN[0] ? argsT[1] : argsT[2])
  if (F === 'TRUNC') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.trunc(n * m) / m) }
  if (F === 'SIGN') return String(Math.sign(argsN[0]))
  if (F === 'PI') return String(Math.PI)
  if (F === 'EVEN') { const n = argsN[0]; const a = Math.ceil(Math.abs(n) / 2) * 2; return String(n < 0 ? -a : a) }
  if (F === 'ODD') { const n = argsN[0]; const a = Math.abs(n); const r = a % 2 === 0 ? a + 1 : Math.ceil(a) | 1; return String(n < 0 ? -r : r) }
  if (F === 'MAPRANGE') { const [v, a, b, c, d] = argsN; return b === a ? wrap('#DIV/0!') : String(c + (d - c) * (v - a) / (b - a)) }
  if (F === 'HYPOT') return String(Math.hypot(...argsN))
  if (F === 'LERP') { const [a, b, t] = argsN; return String(a + (b - a) * t) }
  if (F === 'CLAMP') { const [v, lo, hi] = argsN; return String(Math.min(hi, Math.max(lo, v))) }
  if (F === 'RAND') return String(Math.random())
  if (F === 'RANDFLOAT') { const [lo, hi] = argsN; return String(lo + Math.random() * (hi - lo)) }
  if (F === 'RANDBETWEEN') { const [lo, hi] = argsN; return String(Math.floor(Math.random() * (hi - lo + 1)) + lo) }
  if (F === 'GCD') {
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return String(argsN.map((n) => Math.abs(Math.floor(n))).reduce((a, b) => g(a, b)))
  }
  if (F === 'LCM') {
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return String(argsN.map((n) => Math.abs(Math.floor(n))).reduce((a, b) => (a * b) / g(a, b)))
  }
  if (F === 'MROUND') { const [n, m] = argsN; return m === 0 ? '0' : String(Math.round(n / m) * m) }
  if (F === 'QUOTIENT') { const [n, d] = argsN; return d === 0 ? wrap('#DIV/0!') : String(Math.trunc(n / d)) }
  if (F === 'SQRTPI') return String(Math.sqrt(argsN[0] * Math.PI))
  if (F === 'SIN') return String(Math.sin(argsN[0]))
  if (F === 'COS') return String(Math.cos(argsN[0]))
  if (F === 'TAN') return String(Math.tan(argsN[0]))
  if (F === 'ASIN') return String(Math.asin(argsN[0]))
  if (F === 'ACOS') return String(Math.acos(argsN[0]))
  if (F === 'ATAN') return String(Math.atan(argsN[0]))
  if (F === 'ATAN2') return String(Math.atan2(argsN[0], argsN[1]))
  if (F === 'SINH') return String(Math.sinh(argsN[0]))
  if (F === 'COSH') return String(Math.cosh(argsN[0]))
  if (F === 'TANH') return String(Math.tanh(argsN[0]))
  if (F === 'ASINH') return String(Math.asinh(argsN[0]))
  if (F === 'ACOSH') return String(Math.acosh(argsN[0]))
  if (F === 'ATANH') return String(Math.atanh(argsN[0]))
  if (F === 'DEGREES') return String(argsN[0] * 180 / Math.PI)
  if (F === 'RADIANS') return String(argsN[0] * Math.PI / 180)
  return null
}
