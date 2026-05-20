import { wrap } from './marker'
import { dispatchBaseConv } from './baseConv'

const MAX_FACTORIAL_N = 170
const MAX_NUMERIC_ITERATIONS = 10_000
const MAX_PRIME_CANDIDATE = 10_000_000_000
const MAX_RANDOM_ID_LENGTH = 64

const randomUUID = (): string | undefined => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } }
  return g.crypto?.randomUUID?.()
}

const nonNegativeInteger = (value: number): number | null => {
  const n = Math.floor(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const finiteResult = (value: number): string => Number.isFinite(value) ? String(value) : wrap('#NUM!')

export function dispatchNumeric(F: string, argsT: string[], argsN: number[]): string | null {
  if (F === 'RANDPICK') {
    if (argsT.length === 0) return wrap('#N/A')
    return wrap(argsT[Math.floor(Math.random() * argsT.length)])
  }
  if (F === 'UUID') {
    const u = randomUUID()
      ??
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
    return wrap(u)
  }
  if (F === 'DIGITSUM') {
    const n = nonNegativeInteger(Math.abs(argsN[0]))
    if (n === null || !Number.isSafeInteger(n)) return wrap('#NUM!')
    const s = String(n)
    let total = 0
    for (const ch of s) total += ch.charCodeAt(0) - 48
    return String(total)
  }
  if (F === 'ISPRIME') {
    const n = Math.floor(argsN[0])
    if (!Number.isFinite(n) || n > MAX_PRIME_CANDIDATE) return wrap('#NUM!')
    if (n < 2) return '0'
    if (n < 4) return '1'
    if (n % 2 === 0) return '0'
    for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return '0'
    return '1'
  }
  if (F === 'RANDID') {
    const rawLen = Number(argsT[0] ?? '8')
    if (!Number.isFinite(rawLen)) return wrap('#VALUE!')
    const len = Math.max(1, Math.min(MAX_RANDOM_ID_LENGTH, Math.floor(rawLen)))
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let s = ''
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
    return wrap(s)
  }
  if (F === 'FACT') {
    const n = nonNegativeInteger(argsN[0])
    if (n === null || n > MAX_FACTORIAL_N) return wrap('#NUM!')
    let r = 1
    for (let i = 2; i <= n; i++) r *= i
    return String(r)
  }
  if (F === 'COMBIN' || F === 'PERMUT') {
    const n = nonNegativeInteger(argsN[0]), k = nonNegativeInteger(argsN[1])
    if (n === null || k === null || k > n) return wrap('#NUM!')
    if (F === 'PERMUT') {
      if (k > MAX_NUMERIC_ITERATIONS) return wrap('#NUM!')
      let p = 1
      for (let i = 0; i < k; i++) {
        p *= n - i
        if (!Number.isFinite(p)) return wrap('#NUM!')
      }
      return String(p)
    }
    const steps = Math.min(k, n - k)
    if (steps > MAX_NUMERIC_ITERATIONS) return wrap('#NUM!')
    let c = 1
    for (let i = 1; i <= steps; i++) {
      c = c * (n - steps + i) / i
      if (!Number.isFinite(c)) return wrap('#NUM!')
    }
    return finiteResult(c)
  }
  if (F === 'BITAND') return String(argsN.reduce((a, b) => a & b))
  if (F === 'BITOR') return String(argsN.reduce((a, b) => a | b))
  if (F === 'BITXOR') return String(argsN.reduce((a, b) => a ^ b))
  if (F === 'BITLSHIFT') return String(argsN[0] << argsN[1])
  if (F === 'BITRSHIFT') return String(argsN[0] >>> argsN[1])
  return dispatchBaseConv(F, argsT, argsN)
}
