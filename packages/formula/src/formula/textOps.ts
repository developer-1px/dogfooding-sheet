import { wrap } from './marker'
import { boundedLength, boundedPadEnd, boundedPadStart, boundedRepeat } from './textLimit'

/** Small text utilities: word/line/char counts, padding, slicing, transforms. */
export function dispatchTextOps(F: string, argsT: string[]): string | null {
  if (F === 'LINECOUNT') return String((argsT[0] ?? '') === '' ? 0 : (argsT[0].split(/\r?\n/).length))
  if (F === 'CHARCOUNT') return String([...(argsT[0] ?? '')].length)
  if (F === 'WORDCOUNT') {
    const m = (argsT[0] ?? '').trim().match(/\S+/g)
    return String(m ? m.length : 0)
  }
  if (F === 'COMMONPREFIX' || F === 'COMMONSUFFIX') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    const n = Math.min(a.length, b.length)
    let i = 0
    if (F === 'COMMONPREFIX') { while (i < n && a[i] === b[i]) i++; return wrap(a.slice(0, i)) }
    while (i < n && a[a.length - 1 - i] === b[b.length - 1 - i]) i++
    return wrap(i === 0 ? '' : a.slice(a.length - i))
  }
  if (F === 'MASK') {
    const s = argsT[0] ?? '', show = Math.max(0, Math.floor(Number(argsT[1] ?? '4')))
    const ch = argsT[2] || '*'
    const hide = Math.max(0, s.length - show)
    const mask = boundedRepeat(ch, hide)
    return wrap(mask === null ? '#VALUE!' : mask + s.slice(hide))
  }
  if (F === 'ROT13') return wrap((argsT[0] ?? '').replace(/[A-Za-z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))))
  if (F === 'RANDSTRING') {
    const n = boundedLength(Number(argsT[0] ?? '8'))
    if (n === null) return wrap('#VALUE!')
    const cs = argsT[1] || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let s = ''
    for (let i = 0; i < n; i++) s += cs[Math.floor(Math.random() * cs.length)]
    return wrap(s)
  }
  if (F === 'SQUEEZE') return wrap((argsT[0] ?? '').replace(/\s+/g, ' ').trim())
  if (F === 'DEACCENT') return wrap((argsT[0] ?? '').normalize('NFD').replace(/\p{M}/gu, ''))
  if (F === 'TRUNCATE') {
    const s = argsT[0] ?? '', n = Math.max(0, Math.floor(Number(argsT[1] ?? '0')))
    const tail = argsT[2] ?? '…'
    return wrap(s.length <= n ? s : s.slice(0, Math.max(0, n - tail.length)) + tail)
  }
  if (F === 'INITIALS') {
    const m = (argsT[0] ?? '').trim().match(/\S+/g)
    return wrap(m ? m.map((w) => w[0].toUpperCase()).join('') : '')
  }
  if (F === 'OCCURS') {
    const h = argsT[0] ?? '', n = argsT[1] ?? ''
    if (n === '') return '0'
    let i = 0, c = 0
    while ((i = h.indexOf(n, i)) >= 0) { c++; i += n.length }
    return String(c)
  }
  if (F === 'LPAD') return wrap(boundedPadStart(argsT[0], Number(argsT[1] ?? '0'), argsT[2] || ' ') ?? '#VALUE!')
  if (F === 'RPAD') return wrap(boundedPadEnd(argsT[0], Number(argsT[1] ?? '0'), argsT[2] || ' ') ?? '#VALUE!')
  if (F === 'REVERSE') return wrap([...argsT[0]].reverse().join(''))
  if (F === 'REPT') return wrap(boundedRepeat(argsT[0], Number(argsT[1] ?? '0')) ?? '#VALUE!')
  return null
}
