export function dispatchMath(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'ROUND') { const [n, d = 0] = argsN; const m = 10 ** d; return String(Math.round(n * m) / m) }
  if (F === 'ABS') return String(Math.abs(argsN[0]))
  if (F === 'FLOOR') return String(Math.floor(argsN[0]))
  if (F === 'CEIL') return String(Math.ceil(argsN[0]))
  if (F === 'SQRT') return String(Math.sqrt(argsN[0]))
  if (F === 'POWER') return String(Math.pow(argsN[0], argsN[1]))
  if (F === 'MOD') return String(argsN[0] % argsN[1])
  if (F === 'IF') return String(argsN[0] ? argsT[1] : argsT[2])
  return null
}
