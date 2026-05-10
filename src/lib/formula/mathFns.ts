export function dispatchMath(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'ROUND') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.round(n * m) / m) }
  if (F === 'ABS') return String(Math.abs(argsN[0]))
  if (F === 'FLOOR') return String(Math.floor(argsN[0]))
  if (F === 'CEIL') return String(Math.ceil(argsN[0]))
  if (F === 'SQRT') return String(Math.sqrt(argsN[0]))
  if (F === 'POWER') return String(Math.pow(argsN[0], argsN[1]))
  if (F === 'MOD') return String(argsN[0] % argsN[1])
  if (F === 'INT') return String(Math.trunc(argsN[0]))
  if (F === 'LN') return String(Math.log(argsN[0]))
  if (F === 'LOG') return String(argsN.length > 1 ? Math.log(argsN[0]) / Math.log(argsN[1]) : Math.log10(argsN[0]))
  if (F === 'EXP') return String(Math.exp(argsN[0]))
  if (F === 'ROUNDUP') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.ceil(Math.abs(n) * m) / m * Math.sign(n || 1)) }
  if (F === 'ROUNDDOWN') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.trunc(n * m) / m) }
  if (F === 'IF') return String(argsN[0] ? argsT[1] : argsT[2])
  if (F === 'TRUNC') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.trunc(n * m) / m) }
  if (F === 'SIGN') return String(Math.sign(argsN[0]))
  if (F === 'PI') return String(Math.PI)
  if (F === 'EVEN') { const n = argsN[0]; const a = Math.ceil(Math.abs(n) / 2) * 2; return String(n < 0 ? -a : a) }
  if (F === 'ODD') { const n = argsN[0]; const a = Math.abs(n); const r = a % 2 === 0 ? a + 1 : Math.ceil(a) | 1; return String(n < 0 ? -r : r) }
  if (F === 'RAND') return String(Math.random())
  if (F === 'RANDBETWEEN') { const [lo, hi] = argsN; return String(Math.floor(Math.random() * (hi - lo + 1)) + lo) }
  if (F === 'GCD') {
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return String(argsN.map((n) => Math.abs(Math.floor(n))).reduce((a, b) => g(a, b)))
  }
  if (F === 'LCM') {
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    return String(argsN.map((n) => Math.abs(Math.floor(n))).reduce((a, b) => (a * b) / g(a, b)))
  }
  return null
}
