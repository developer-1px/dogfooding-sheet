import { collectRefs } from './parse'

type Eval = (s: string) => string

/** ARRAYTOTEXT(range, [sep=", "]) — flatten non-empty values to a separated string. */
export function arrayToText(rangeStr: string, sep: string, cells: Record<string, string>, evalRaw: Eval): string {
  return collectRefs(rangeStr).map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '').join(sep)
}

export function strStat(F: 'MAXSTR' | 'MINSTR', rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  const vals = collectRefs(rangeStr).map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  let best = vals[0]
  for (let i = 1; i < vals.length; i++) if (F === 'MAXSTR' ? vals[i] > best : vals[i] < best) best = vals[i]
  return best
}

export function lenStat(F: 'MAXLEN' | 'MINLEN', rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  const lens = collectRefs(rangeStr).map((r) => evalRaw(cells[r] ?? '').length).filter((n) => n > 0)
  if (lens.length === 0) return '0'
  return String(F === 'MAXLEN' ? Math.max(...lens) : Math.min(...lens))
}

export function firstLast(F: 'FIRST' | 'LAST', rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  const refs = collectRefs(rangeStr)
  const seq = F === 'FIRST' ? refs : [...refs].reverse()
  for (const r of seq) { const v = evalRaw(cells[r] ?? ''); if (v !== '') return v }
  return '#N/A'
}

export function rangeHash(rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  let h = 2166136261
  for (const r of collectRefs(rangeStr)) {
    const v = evalRaw(cells[r] ?? '') + '|'
    for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619) }
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** MOSTCOMMON(range) — most frequent non-empty value (string-based). */
export function mostCommon(rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  const counts = new Map<string, number>()
  for (const r of collectRefs(rangeStr)) {
    const v = evalRaw(cells[r] ?? '')
    if (v !== '') counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best = '', bc = 0
  for (const [v, c] of counts) if (c > bc) { best = v; bc = c }
  return bc === 0 ? '#N/A' : best
}

/** COUNTNUMERIC(range) — number of cells whose evaluated value is finite. */
export function countNumeric(rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  let n = 0
  for (const r of collectRefs(rangeStr)) {
    const v = evalRaw(cells[r] ?? '')
    if (v !== '' && Number.isFinite(Number(v))) n++
  }
  return String(n)
}

export function sample(rangeStr: string, cells: Record<string, string>, evalRaw: Eval): string {
  const vals = collectRefs(rangeStr).map((r) => evalRaw(cells[r] ?? '')).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  return vals[Math.floor(Math.random() * vals.length)]
}
