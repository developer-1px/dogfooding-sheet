import { wrap } from './marker'

export function dispatchTextCase(F: string, argsT: string[]): string | null {
  if (F === 'UPPER') return wrap(argsT[0].toUpperCase())
  if (F === 'LOWER') return wrap(argsT[0].toLowerCase())
  if (F === 'PROPER') return wrap(argsT[0].toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, sp, ch) => sp + ch.toUpperCase()))
  if (F === 'SLUG') return wrap((argsT[0] ?? '').toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''))
  if (F === 'CAMELCASE') return wrap((argsT[0] ?? '').replace(/[-_\s]+(.)?/g, (_m, c) => c ? c.toUpperCase() : '').replace(/^./, (c) => c.toLowerCase()))
  if (F === 'SNAKECASE') return wrap((argsT[0] ?? '').replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()).replace(/[\s-]+/g, '_').replace(/^_+|_+$/g, ''))
  if (F === 'KEBABCASE') return wrap((argsT[0] ?? '').replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()).replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, ''))
  return null
}
