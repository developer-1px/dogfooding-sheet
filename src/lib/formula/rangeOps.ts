import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

export function largeSmall(F: 'LARGE' | 'SMALL', rangeStr: string, k: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite).sort((a, b) => a - b)
  if (k < 1 || k > nums.length) return '#NUM!'
  return String(F === 'LARGE' ? nums[nums.length - k] : nums[k - 1])
}

export function sumproduct(rangeStrs: string[], numFromCell: NumFromCell): string {
  if (rangeStrs.length === 0) return '0'
  const cols = rangeStrs.map((s) => collectRefs(s).map(numFromCell))
  const len = Math.min(...cols.map((c) => c.length))
  let sum = 0
  for (let i = 0; i < len; i++) {
    let p = 1
    for (const c of cols) p *= (c[i] ?? 0)
    sum += p
  }
  return String(sum)
}

export function weightAvg(vStr: string, wStr: string, numFromCell: NumFromCell): string {
  const V = collectRefs(vStr).map(numFromCell)
  const W = collectRefs(wStr).map(numFromCell)
  const n = Math.min(V.length, W.length)
  if (n === 0) return '#NUM!'
  let s = 0, t = 0
  for (let i = 0; i < n; i++) { s += V[i] * W[i]; t += W[i] }
  return t === 0 ? '#DIV/0!' : String(s / t)
}

export function sample(rangeStr: string, cells: Record<string, string>, evalRaw: (s: string) => string): string {
  const refs = collectRefs(rangeStr)
  const vals = refs.map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  return vals[Math.floor(Math.random() * vals.length)]
}

/** ARRAYTOTEXT(range, [sep=", "]) — flatten non-empty values to a separated string. */
export function arrayToText(rangeStr: string, sep: string, cells: Record<string, string>, evalRaw: (s: string) => string): string {
  const refs = collectRefs(rangeStr)
  return refs.map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '').join(sep)
}

/** FIRST(range) / LAST(range) — first / last non-empty value. */
export function firstLast(F: 'FIRST' | 'LAST', rangeStr: string, cells: Record<string, string>, evalRaw: (s: string) => string): string {
  const refs = collectRefs(rangeStr)
  const seq = F === 'FIRST' ? refs : [...refs].reverse()
  for (const r of seq) {
    const v = evalRaw(cells[r] ?? '')
    if (v !== '') return v
  }
  return '#N/A'
}

export function rank(value: number, rangeStr: string, order: number, numFromCell: NumFromCell): string {
  const nums = collectRefs(rangeStr).map(numFromCell).filter(Number.isFinite)
  if (!nums.includes(value)) return '#N/A'
  const desc = order === 0
  return String(nums.filter((n) => desc ? n > value : n < value).length + 1)
}
