import { collectRefs } from './parse'

type Cells = Record<string, string>

const matchCriteria = (value: string, criteria: string): boolean => {
  const c = criteria.trim()
  for (const op of ['>=', '<=', '<>', '>=', '>', '<', '='] as const) {
    if (c.startsWith(op)) {
      const rest = c.slice(op.length).trim()
      const a = Number(value), b = Number(rest)
      const numeric = Number.isFinite(a) && Number.isFinite(b)
      if (op === '<>') return value !== rest
      if (op === '=') return value === rest
      if (!numeric) return false
      if (op === '>=') return a >= b
      if (op === '<=') return a <= b
      if (op === '>') return a > b
      if (op === '<') return a < b
    }
  }
  return value === c
}

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

