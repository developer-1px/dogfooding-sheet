import { wrap } from './marker'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

export const MAX_TEXT_ALGORITHM_WORK = 250_000

const isSafeText = (...values: string[]): boolean =>
  values.every(value => value.length <= MAX_GENERATED_TEXT_LENGTH)

const isSafePairWork = (a: string, b: string): boolean => {
  const work = a.length * b.length
  return isSafeText(a, b) && Number.isSafeInteger(work) && work <= MAX_TEXT_ALGORITHM_WORK
}

const matchesWildcard = (text: string, pattern: string): boolean => {
  let ti = 0
  let pi = 0
  let star = -1
  let afterStar = 0

  while (ti < text.length) {
    if (pattern[pi] === '?' || pattern[pi] === text[ti]) {
      ti++
      pi++
    } else if (pattern[pi] === '*') {
      star = pi
      afterStar = ti
      pi++
    } else if (star >= 0) {
      pi = star + 1
      afterStar++
      ti = afterStar
    } else {
      return false
    }
  }

  while (pattern[pi] === '*') pi++
  return pi === pattern.length
}

export function dispatchTextAlgo(F: string, argsT: string[]): string | null {
  if (F === 'LIKE') {
    const text = argsT[0] ?? '', pattern = argsT[1] ?? ''
    if (!isSafeText(text, pattern)) return wrap('#VALUE!')
    return matchesWildcard(text, pattern) ? '1' : '0'
  }
  if (F === 'SOUNDEX') {
    if (!isSafeText(argsT[0] ?? '')) return wrap('#VALUE!')
    const s = (argsT[0] ?? '').toUpperCase().replace(/[^A-Z]/g, '')
    if (!s) return '\x01\x01'
    const map: Record<string, string> = { B: '1', F: '1', P: '1', V: '1', C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', D: '3', T: '3', L: '4', M: '5', N: '5', R: '6' }
    let out = s[0]
    let prev = map[s[0]] ?? ''
    for (let i = 1; i < s.length && out.length < 4; i++) {
      const code = map[s[i]] ?? ''
      if (code && code !== prev) out += code
      if (code !== '') prev = code
      else prev = ''
    }
    return '\x01' + (out + '000').slice(0, 4) + '\x01'
  }
  if (F === 'LEVENSHTEIN') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    if (!isSafePairWork(a, b)) return wrap('#VALUE!')
    const dp = Array.from({ length: a.length + 1 }, (_, i) => i)
    for (let j = 1; j <= b.length; j++) {
      let prev = dp[0]; dp[0] = j
      for (let i = 1; i <= a.length; i++) {
        const tmp = dp[i]
        dp[i] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[i - 1], dp[i]) + 1
        prev = tmp
      }
    }
    return String(dp[a.length])
  }
  if (F === 'HAMMING') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    if (!isSafeText(a, b)) return wrap('#VALUE!')
    if (a.length !== b.length) return wrap('#N/A')
    let d = 0
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
    return String(d)
  }
  if (F === 'DICE') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    if (!isSafeText(a, b)) return wrap('#VALUE!')
    if (a.length < 2 || b.length < 2) return '#N/A'
    const bigrams = (s: string) => { const m = new Map<string, number>(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); m.set(k, (m.get(k) ?? 0) + 1) } return m }
    const A = bigrams(a), B = bigrams(b)
    let inter = 0
    for (const [k, v] of A) inter += Math.min(v, B.get(k) ?? 0)
    return String((2 * inter) / (a.length + b.length - 2))
  }
  if (F === 'LCS') {
    const a = argsT[0] ?? '', b = argsT[1] ?? ''
    if (!isSafePairWork(a, b)) return wrap('#VALUE!')
    const dp = new Array(b.length + 1).fill(0)
    for (let i = 1; i <= a.length; i++) {
      let prev = 0
      for (let j = 1; j <= b.length; j++) {
        const tmp = dp[j]
        dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1])
        prev = tmp
      }
    }
    return String(dp[b.length])
  }
  return null
}
