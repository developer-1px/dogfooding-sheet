export function dispatchLogic(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'AND') return argsN.every((n) => !!n) ? '1' : '0'
  if (F === 'OR') return argsN.some((n) => !!n) ? '1' : '0'
  if (F === 'NOT') return argsN[0] ? '0' : '1'
  if (F === 'ISBLANK') return argsT[0] === '' ? '1' : '0'
  if (F === 'ISNUMBER') return argsT[0] !== '' && Number.isFinite(Number(argsT[0])) ? '1' : '0'
  if (F === 'ISTEXT') return argsT[0] !== '' && !Number.isFinite(Number(argsT[0])) ? '1' : '0'
  return null
}
