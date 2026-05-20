import type { Cells } from '../a1'
import type { EvalCell } from './args'
import { collectRefs } from './parse'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

const valueError = (): string => '#VALUE!'
const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''

/** ARRAYTOTEXT(range, [sep=", "]) — flatten non-empty values to a separated string. */
export function arrayToText(rangeStr: string | undefined, sep: string, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const out: string[] = []
  let length = 0
  for (const ref of collectRefs(rangeStr)) {
    const value = evalCell(ref)
    if (value === '') continue
    length += value.length + (out.length > 0 ? sep.length : 0)
    if (length > MAX_GENERATED_TEXT_LENGTH) return valueError()
    out.push(value)
  }
  return out.join(sep)
}

export function strStat(F: 'MAXSTR' | 'MINSTR', rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const vals = collectRefs(rangeStr).map(evalCell).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  let best = vals[0]
  for (let i = 1; i < vals.length; i++) if (F === 'MAXSTR' ? vals[i] > best : vals[i] < best) best = vals[i]
  return best
}

export function lenStat(F: 'MAXLEN' | 'MINLEN', rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const lens = collectRefs(rangeStr).map((r) => evalCell(r).length).filter((n) => n > 0)
  if (lens.length === 0) return '0'
  return String(F === 'MAXLEN' ? Math.max(...lens) : Math.min(...lens))
}

export function firstLast(F: 'FIRST' | 'LAST', rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const refs = collectRefs(rangeStr)
  const seq = F === 'FIRST' ? refs : [...refs].reverse()
  for (const r of seq) { const v = evalCell(r); if (v !== '') return v }
  return '#N/A'
}

export function rangeHash(rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  let h = 2166136261
  for (const r of collectRefs(rangeStr)) {
    const v = evalCell(r) + '|'
    for (let i = 0; i < v.length; i++) { h ^= v.charCodeAt(i); h = Math.imul(h, 16777619) }
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export { rangeJSON, rangeCsv, rangeUnique, rangeSort } from './rangeSerial'

export function freqStat(F: 'MOSTCOMMON' | 'LEASTCOMMON', rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const counts = new Map<string, number>()
  for (const r of collectRefs(rangeStr)) {
    const v = evalCell(r)
    if (v !== '') counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  if (counts.size === 0) return '#N/A'
  let best = '', bc = F === 'MOSTCOMMON' ? -1 : Infinity
  for (const [v, c] of counts) if (F === 'MOSTCOMMON' ? c > bc : c < bc) { best = v; bc = c }
  return best
}

/** ENTROPY(range) — Shannon entropy (base 2) over value frequencies. */
export function entropy(rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const counts = new Map<string, number>()
  let n = 0
  for (const r of collectRefs(rangeStr)) {
    const v = evalCell(r)
    if (v !== '') { counts.set(v, (counts.get(v) ?? 0) + 1); n++ }
  }
  if (n === 0) return '#N/A'
  let h = 0
  for (const c of counts.values()) { const p = c / n; h -= p * Math.log2(p) }
  return String(h)
}

export const mostCommon = (r: string, c: Cells, e: EvalCell) => freqStat('MOSTCOMMON', r, c, e)

/** COUNTNUMERIC(range) — number of cells whose evaluated value is finite. */
export function countNumeric(rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  let n = 0
  for (const r of collectRefs(rangeStr)) {
    const v = evalCell(r)
    if (v !== '' && Number.isFinite(Number(v))) n++
  }
  return String(n)
}

export function sample(rangeStr: string | undefined, _cells: Cells, evalCell: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const vals = collectRefs(rangeStr).map(evalCell).filter((v) => v !== '')
  if (vals.length === 0) return '#N/A'
  return vals[Math.floor(Math.random() * vals.length)]
}
