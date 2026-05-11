import type { Cells } from '../a1'
import { collectRefs } from './parse'
import { matchCriteria } from './criteriaMatch'


export function countif(rangeStr: string, criteria: string, cells: Cells, evalRaw: (s: string) => string): number {
  const refs = collectRefs(rangeStr)
  let n = 0
  for (const r of refs) {
    if (matchCriteria(evalRaw(cells[r] ?? ''), criteria)) n++
  }
  return n
}

export function sumif(
  rangeStr: string,
  criteria: string,
  sumRangeStr: string | undefined,
  cells: Cells,
  evalRaw: (s: string) => string,
): number {
  const refs = collectRefs(rangeStr)
  const sumRefs = sumRangeStr ? collectRefs(sumRangeStr) : refs
  let sum = 0
  for (let i = 0; i < refs.length; i++) {
    if (matchCriteria(evalRaw(cells[refs[i]] ?? ''), criteria)) {
      const v = Number(evalRaw(cells[sumRefs[i] ?? refs[i]] ?? ''))
      if (Number.isFinite(v)) sum += v
    }
  }
  return sum
}

export function counta(rangeStr: string, cells: Cells, evalRaw: (s: string) => string): number {
  const refs = collectRefs(rangeStr)
  let n = 0
  for (const r of refs) {
    if (evalRaw(cells[r] ?? '') !== '') n++
  }
  return n
}

export function countblank(rangeStr: string, cells: Cells, evalRaw: (s: string) => string): number {
  const refs = collectRefs(rangeStr)
  let n = 0
  for (const r of refs) {
    if (evalRaw(cells[r] ?? '') === '') n++
  }
  return n
}

export function countunique(rangeStr: string, cells: Cells, evalRaw: (s: string) => string): number {
  const seen = new Set<string>()
  for (const r of collectRefs(rangeStr)) {
    const v = evalRaw(cells[r] ?? '')
    if (v !== '') seen.add(v)
  }
  return seen.size
}

export function averageif(
  rangeStr: string,
  criteria: string,
  avgRangeStr: string | undefined,
  cells: Cells,
  evalRaw: (s: string) => string,
): number {
  const refs = collectRefs(rangeStr)
  const avgRefs = avgRangeStr ? collectRefs(avgRangeStr) : refs
  let sum = 0, n = 0
  for (let i = 0; i < refs.length; i++) {
    if (!matchCriteria(evalRaw(cells[refs[i]] ?? ''), criteria)) continue
    const v = Number(evalRaw(cells[avgRefs[i] ?? refs[i]] ?? ''))
    if (Number.isFinite(v)) { sum += v; n++ }
  }
  return n > 0 ? sum / n : NaN
}

