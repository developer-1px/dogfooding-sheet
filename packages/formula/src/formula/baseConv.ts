import { wrap } from './marker'

export function dispatchBaseConv(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'BASE') {
    const [n, base, minLen = 0] = argsN
    if (base < 2 || base > 36) return wrap('#NUM!')
    return wrap(Math.floor(n).toString(base).toUpperCase().padStart(minLen, '0'))
  }
  if (F === 'DECIMAL') { const n = parseInt(argsT[0] ?? '', argsN[1]); return Number.isFinite(n) ? String(n) : wrap('#NUM!') }
  if (F === 'HEX2DEC') { const n = parseInt(argsT[0] ?? '', 16); return Number.isFinite(n) ? String(n) : wrap('#NUM!') }
  if (F === 'DEC2HEX') return wrap(Math.floor(argsN[0]).toString(16).toUpperCase())
  if (F === 'BIN2HEX') { const n = parseInt(argsT[0] ?? '', 2); return Number.isFinite(n) ? wrap(n.toString(16).toUpperCase()) : wrap('#NUM!') }
  if (F === 'HEX2BIN') { const n = parseInt(argsT[0] ?? '', 16); return Number.isFinite(n) ? wrap(n.toString(2)) : wrap('#NUM!') }
  if (F === 'OCT2BIN') { const n = parseInt(argsT[0] ?? '', 8); return Number.isFinite(n) ? wrap(n.toString(2)) : wrap('#NUM!') }
  if (F === 'OCT2HEX') { const n = parseInt(argsT[0] ?? '', 8); return Number.isFinite(n) ? wrap(n.toString(16).toUpperCase()) : wrap('#NUM!') }
  if (F === 'BIN2OCT') { const n = parseInt(argsT[0] ?? '', 2); return Number.isFinite(n) ? wrap(n.toString(8)) : wrap('#NUM!') }
  if (F === 'HEX2OCT') { const n = parseInt(argsT[0] ?? '', 16); return Number.isFinite(n) ? wrap(n.toString(8)) : wrap('#NUM!') }
  if (F === 'OCT2DEC') { const n = parseInt(argsT[0] ?? '', 8); return Number.isFinite(n) ? String(n) : wrap('#NUM!') }
  if (F === 'DEC2OCT') return wrap(Math.floor(argsN[0]).toString(8))
  if (F === 'BIN2DEC') { const n = parseInt(argsT[0] ?? '', 2); return Number.isFinite(n) ? String(n) : wrap('#NUM!') }
  if (F === 'DEC2BIN') return wrap(Math.floor(argsN[0]).toString(2))
  if (F === 'ROMAN') {
    let n = Math.floor(argsN[0])
    if (n < 0 || n > 3999) return wrap('#VALUE!')
    const map: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
    let out = ''
    for (const [v, s] of map) while (n >= v) { out += s; n -= v }
    return wrap(out)
  }
  if (F === 'ARABIC') {
    const s = (argsT[0] ?? '').toUpperCase()
    if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(s)) return wrap('#VALUE!')
    const m: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
    let total = 0
    for (let i = 0; i < s.length; i++) {
      const cur = m[s[i]], next = m[s[i + 1]]
      total += next > cur ? -cur : cur
    }
    return String(total)
  }
  return null
}
