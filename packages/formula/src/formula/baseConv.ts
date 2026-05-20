import { wrap } from './marker'
import { boundedPadStart } from './textLimit'

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const isValidRadix = (radix: number): boolean =>
  Number.isInteger(radix) && radix >= 2 && radix <= 36

const parseBaseInteger = (value: string, radix: number): number | null => {
  if (!isValidRadix(radix)) return null
  const text = value.trim().toUpperCase()
  const body = text.replace(/^[+-]/, '')
  if (body === '') return null
  for (let i = 0; i < body.length; i++) {
    const digit = DIGITS.indexOf(body[i])
    if (digit < 0 || digit >= radix) return null
  }
  const n = parseInt(text, radix)
  return Number.isFinite(n) ? n : null
}

const formatBaseInteger = (value: number, radix: number): string | null => {
  if (!Number.isFinite(value) || !isValidRadix(radix)) return null
  return Math.floor(value).toString(radix).toUpperCase()
}

export function dispatchBaseConv(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'BASE') {
    const [n, base, minLen = 0] = argsN
    const value = formatBaseInteger(n, base)
    if (value === null) return wrap('#NUM!')
    return wrap(boundedPadStart(value, minLen, '0') ?? '#VALUE!')
  }
  if (F === 'DECIMAL') { const n = parseBaseInteger(argsT[0] ?? '', argsN[1]); return n === null ? wrap('#NUM!') : String(n) }
  if (F === 'HEX2DEC') { const n = parseBaseInteger(argsT[0] ?? '', 16); return n === null ? wrap('#NUM!') : String(n) }
  if (F === 'DEC2HEX') { const value = formatBaseInteger(argsN[0], 16); return value === null ? wrap('#NUM!') : wrap(value) }
  if (F === 'BIN2HEX') { const n = parseBaseInteger(argsT[0] ?? '', 2); return n === null ? wrap('#NUM!') : wrap(n.toString(16).toUpperCase()) }
  if (F === 'HEX2BIN') { const n = parseBaseInteger(argsT[0] ?? '', 16); return n === null ? wrap('#NUM!') : wrap(n.toString(2)) }
  if (F === 'OCT2BIN') { const n = parseBaseInteger(argsT[0] ?? '', 8); return n === null ? wrap('#NUM!') : wrap(n.toString(2)) }
  if (F === 'OCT2HEX') { const n = parseBaseInteger(argsT[0] ?? '', 8); return n === null ? wrap('#NUM!') : wrap(n.toString(16).toUpperCase()) }
  if (F === 'BIN2OCT') { const n = parseBaseInteger(argsT[0] ?? '', 2); return n === null ? wrap('#NUM!') : wrap(n.toString(8)) }
  if (F === 'HEX2OCT') { const n = parseBaseInteger(argsT[0] ?? '', 16); return n === null ? wrap('#NUM!') : wrap(n.toString(8)) }
  if (F === 'OCT2DEC') { const n = parseBaseInteger(argsT[0] ?? '', 8); return n === null ? wrap('#NUM!') : String(n) }
  if (F === 'DEC2OCT') { const value = formatBaseInteger(argsN[0], 8); return value === null ? wrap('#NUM!') : wrap(value) }
  if (F === 'BIN2DEC') { const n = parseBaseInteger(argsT[0] ?? '', 2); return n === null ? wrap('#NUM!') : String(n) }
  if (F === 'DEC2BIN') { const value = formatBaseInteger(argsN[0], 2); return value === null ? wrap('#NUM!') : wrap(value) }
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
