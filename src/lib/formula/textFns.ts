import { wrap } from './marker'

export function dispatchText(F: string, argsT: string[]): string | null {
  if (F === 'CONCAT') return wrap(argsT.join(''))
  if (F === 'LEN') return String(argsT[0].length)
  if (F === 'UPPER') return wrap(argsT[0].toUpperCase())
  if (F === 'LOWER') return wrap(argsT[0].toLowerCase())
  if (F === 'LEFT') return wrap(argsT[0].slice(0, Number(argsT[1] ?? '1')))
  if (F === 'RIGHT') return wrap(argsT[0].slice(-Number(argsT[1] ?? '1')))
  if (F === 'MID') return wrap(argsT[0].slice(Number(argsT[1]) - 1, Number(argsT[1]) - 1 + Number(argsT[2])))
  if (F === 'TRIM') return wrap(argsT[0].trim())
  if (F === 'SUBSTITUTE') return wrap(argsT[0].split(argsT[1] ?? '').join(argsT[2] ?? ''))
  if (F === 'FIND') {
    const pos = argsT[1].indexOf(argsT[0])
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'SEARCH') {
    const pos = argsT[1].toLowerCase().indexOf(argsT[0].toLowerCase())
    return pos < 0 ? wrap('#VALUE!') : String(pos + 1)
  }
  if (F === 'REPT') return wrap(argsT[0].repeat(Math.max(0, Number(argsT[1] ?? '0'))))
  if (F === 'PROPER') {
    return wrap(argsT[0].toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, sp, ch) => sp + ch.toUpperCase()))
  }
  if (F === 'TEXTJOIN') {
    const sep = argsT[0] ?? ''
    const ignoreEmpty = (argsT[1] ?? '1') !== '0'
    const parts = argsT.slice(2)
    return wrap((ignoreEmpty ? parts.filter((p) => p !== '') : parts).join(sep))
  }
  if (F === 'EXACT') return argsT[0] === argsT[1] ? '1' : '0'
  if (F === 'CHAR') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? wrap(String.fromCharCode(n)) : wrap('#VALUE!')
  }
  if (F === 'CODE') {
    return argsT[0].length > 0 ? String(argsT[0].charCodeAt(0)) : wrap('#VALUE!')
  }
  if (F === 'VALUE') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? String(n) : wrap('#VALUE!')
  }
  if (F === 'N') {
    const n = Number(argsT[0])
    return Number.isFinite(n) ? String(n) : '0'
  }
  if (F === 'REPLACE') {
    const start = Number(argsT[1]) - 1
    const len = Number(argsT[2])
    return wrap(argsT[0].slice(0, start) + (argsT[3] ?? '') + argsT[0].slice(start + len))
  }
  return null
}
