import { smartReturn } from './marker'

export function dispatchLogic(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'AND') return argsN.every((n) => !!n) ? '1' : '0'
  if (F === 'OR') return argsN.some((n) => !!n) ? '1' : '0'
  if (F === 'NOT') return argsN[0] ? '0' : '1'
  if (F === 'ISBLANK') return argsT[0] === '' ? '1' : '0'
  if (F === 'ISNUMBER') return argsT[0] !== '' && Number.isFinite(Number(argsT[0])) ? '1' : '0'
  if (F === 'ISTEXT') return argsT[0] !== '' && !Number.isFinite(Number(argsT[0])) ? '1' : '0'
  if (F === 'IFS') {
    for (let i = 0; i + 1 < argsT.length; i += 2) {
      if (argsN[i]) return smartReturn(argsT[i + 1])
    }
    return smartReturn('#N/A')
  }
  if (F === 'SWITCH') {
    const expr = argsT[0]
    const last = argsT.length
    for (let i = 1; i + 1 < last; i += 2) {
      if (argsT[i] === expr) return smartReturn(argsT[i + 1])
    }
    return smartReturn((last - 1) % 2 === 1 ? argsT[last - 1] : '#N/A')
  }
  return null
}
