import { smartReturn } from './marker'

export function dispatchLogic(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'AND') return argsN.every((n) => !!n) ? '1' : '0'
  if (F === 'OR') return argsN.some((n) => !!n) ? '1' : '0'
  if (F === 'NOT') return argsN[0] ? '0' : '1'
  if (F === 'XOR') return argsN.reduce((a, n) => a ^ (n ? 1 : 0), 0) ? '1' : '0'
  if (F === 'TRUE') return '1'
  if (F === 'FALSE') return '0'
  if (F === 'YESNO') return smartReturn(argsN[0] ? '예' : '아니오')
  if (F === 'BOOLTEXT') return smartReturn(argsN[0] ? 'TRUE' : 'FALSE')
  if (F === 'BOOLEAN') {
    const s = (argsT[0] ?? '').trim().toLowerCase()
    if (s === '' || s === '0' || s === 'false' || s === 'no' || s === 'n' || s === 'off') return '0'
    return '1'
  }
  if (F === 'ISURL') return /^https?:\/\/[^\s]+$/.test(argsT[0] ?? '') ? '1' : '0'
  if (F === 'ISEMAIL') return /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(argsT[0] ?? '') ? '1' : '0'
  if (F === 'ISBLANK') return argsT[0] === '' ? '1' : '0'
  if (F === 'ISNUMBER') return argsT[0] !== '' && Number.isFinite(Number(argsT[0])) ? '1' : '0'
  if (F === 'ISTEXT') return argsT[0] !== '' && !Number.isFinite(Number(argsT[0])) ? '1' : '0'
  if (F === 'ISERROR') return /^#[A-Z/]+!?$/.test(argsT[0]) ? '1' : '0'
  if (F === 'TYPE') {
    const v = argsT[0]
    if (/^#[A-Z/]+!?$/.test(v)) return '16'
    if (v === '1' || v === '0') return '4'
    if (v !== '' && Number.isFinite(Number(v))) return '1'
    return '2'
  }
  if (F === 'NA') return smartReturn('#N/A')
  if (F === 'CHOOSE') {
    const i = Math.floor(Number(argsT[0]))
    return smartReturn(i >= 1 && i < argsT.length ? argsT[i] : '#VALUE!')
  }
  if (F === 'IFEMPTY') return smartReturn(argsT[0] === '' ? (argsT[1] ?? '') : argsT[0])
  if (F === 'COALESCE') {
    for (const v of argsT) if (v !== '') return smartReturn(v)
    return smartReturn('')
  }
  if (F === 'ISEVEN') return Number.isFinite(argsN[0]) && Math.floor(argsN[0]) % 2 === 0 ? '1' : '0'
  if (F === 'ISODD') return Number.isFinite(argsN[0]) && Math.abs(Math.floor(argsN[0])) % 2 === 1 ? '1' : '0'
  if (F === 'ISBETWEEN') {
    const v = argsN[0], lo = argsN[1], hi = argsN[2]
    const lowOpen = (argsT[3] ?? '1') === '0', highOpen = (argsT[4] ?? '1') === '0'
    return Number.isFinite(v) && (lowOpen ? v > lo : v >= lo) && (highOpen ? v < hi : v <= hi) ? '1' : '0'
  }
  if (F === 'IFERROR') {
    const v = argsT[0]
    const isErr = typeof v === 'string' && /^#[A-Z/]+!?$/.test(v)
    return smartReturn(isErr ? (argsT[1] ?? '') : v)
  }
  if (F === 'IFNA') {
    return smartReturn(argsT[0] === '#N/A' ? (argsT[1] ?? '') : argsT[0])
  }
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
