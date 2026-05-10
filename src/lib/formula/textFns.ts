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
  return null
}
