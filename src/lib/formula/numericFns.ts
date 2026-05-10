import { wrap } from './marker'
import { dispatchBaseConv } from './baseConv'

export function dispatchNumeric(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'RANDPICK') {
    if (argsT.length === 0) return wrap('#N/A')
    return wrap(argsT[Math.floor(Math.random() * argsT.length)])
  }
  if (F === 'UUID') {
    const u = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
        })
    return wrap(u)
  }
  if (F === 'DIGITSUM') {
    const s = String(Math.abs(Math.floor(argsN[0])))
    let total = 0
    for (const ch of s) total += ch.charCodeAt(0) - 48
    return String(total)
  }
  if (F === 'ISPRIME') {
    const n = Math.floor(argsN[0])
    if (n < 2) return '0'
    if (n < 4) return '1'
    if (n % 2 === 0) return '0'
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return '0'
    return '1'
  }
  if (F === 'RANDID') {
    const len = Math.max(1, Math.min(64, Number(argsT[0] ?? '8')))
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let s = ''
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return wrap(s)
  }
  if (F === 'FACT') {
    const n = Math.floor(argsN[0])
    if (n < 0 || !Number.isFinite(n)) return wrap('#NUM!')
    let r = 1
    for (let i = 2; i <= n; i++) r *= i
    return String(r)
  }
  if (F === 'COMBIN' || F === 'PERMUT') {
    const n = Math.floor(argsN[0]), k = Math.floor(argsN[1])
    if (n < 0 || k < 0 || k > n) return wrap('#NUM!')
    let p = 1
    for (let i = 0; i < k; i++) p *= n - i
    if (F === 'PERMUT') return String(p)
    let kf = 1
    for (let i = 2; i <= k; i++) kf *= i
    return String(p / kf)
  }
  if (F === 'BITAND') return String(argsN.reduce((a, b) => a & b))
  if (F === 'BITOR') return String(argsN.reduce((a, b) => a | b))
  if (F === 'BITXOR') return String(argsN.reduce((a, b) => a ^ b))
  if (F === 'BITLSHIFT') return String(argsN[0] << argsN[1])
  if (F === 'BITRSHIFT') return String(argsN[0] >>> argsN[1])
  return dispatchBaseConv(F, argsT, argsN)
}
