import type { Eval } from './args'
import type { Cells } from '../a1'
import { parseRange, evalCell } from './rangeRect'
import { coerceNumber } from './coerce'


export { parseRange }

const isExactLookup = (rangeLookup: string | undefined): boolean => {
  const value = (rangeLookup ?? '').trim().replace(/^"|"$/g, '').toLowerCase()
  return value === '0' || value === 'false'
}

const compareLookupValues = (a: string, b: string): number => {
  const an = coerceNumber(a)
  const bn = coerceNumber(b)
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
}

export function vlookup(
  key: string,
  rangeStr: string,
  colIdx: number,
  cells: Cells,
  evalRaw: Eval,
  rangeLookup?: string,
): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetCol = r.cMin + colIdx - 1
  if (colIdx < 1) return '#VALUE!'
  if (targetCol > r.cMax) return '#REF!'
  let approximate = '#N/A'
  for (let row = r.rMin; row <= r.rMax; row++) {
    const value = evalCell(cells, r.cMin, row, evalRaw)
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) {
      return evalCell(cells, targetCol, row, evalRaw)
    }
    if (!isExactLookup(rangeLookup) && cmp < 0) approximate = evalCell(cells, targetCol, row, evalRaw)
  }
  return isExactLookup(rangeLookup) ? '#N/A' : approximate
}

export function hlookup(
  key: string,
  rangeStr: string,
  rowIdx: number,
  cells: Cells,
  evalRaw: Eval,
  rangeLookup?: string,
): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetRow = r.rMin + rowIdx - 1
  if (rowIdx < 1) return '#VALUE!'
  if (targetRow > r.rMax) return '#REF!'
  let approximate = '#N/A'
  for (let col = r.cMin; col <= r.cMax; col++) {
    const value = evalCell(cells, col, r.rMin, evalRaw)
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) {
      return evalCell(cells, col, targetRow, evalRaw)
    }
    if (!isExactLookup(rangeLookup) && cmp < 0) approximate = evalCell(cells, col, targetRow, evalRaw)
  }
  return isExactLookup(rangeLookup) ? '#N/A' : approximate
}

export function xlookup(
  key: string,
  lookupRangeStr: string,
  resultRangeStr: string,
  ifNotFound: string | undefined,
  cells: Cells,
  evalRaw: Eval,
): string {
  const L = parseRange(lookupRangeStr), R = parseRange(resultRangeStr)
  if (!L || !R) return '#REF!'
  const len = Math.max(L.rMax - L.rMin, L.cMax - L.cMin) + 1
  const rowMode = L.rMax > L.rMin
  for (let i = 0; i < len; i++) {
    const lc = rowMode ? L.cMin : L.cMin + i
    const lr = rowMode ? L.rMin + i : L.rMin
    if (evalCell(cells, lc, lr, evalRaw) === key) {
      const rc = rowMode ? R.cMin : R.cMin + i
      const rr = rowMode ? R.rMin + i : R.rMin
      return evalCell(cells, rc, rr, evalRaw)
    }
  }
  return ifNotFound ?? '#N/A'
}

export function index(rangeStr: string, row: number, col: number, cells: Cells, evalRaw: Eval): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const tr = r.rMin + row - 1
  const tc = r.cMin + col - 1
  if (tr > r.rMax || tc > r.cMax || tr < r.rMin || tc < r.cMin) return '#REF!'
  return evalCell(cells, tc, tr, evalRaw)
}

export function match(key: string, rangeStr: string, cells: Cells, evalRaw: Eval, matchType = 1): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  let pos = 0
  let approximate = '#N/A'
  if (![1, 0, -1].includes(matchType)) return '#VALUE!'
  for (let row = r.rMin; row <= r.rMax; row++) {
    for (let col = r.cMin; col <= r.cMax; col++) {
      pos++
      const cmp = compareLookupValues(evalCell(cells, col, row, evalRaw), key)
      if (cmp === 0) return String(pos)
      if (matchType === 1 && cmp < 0) approximate = String(pos)
      if (matchType === -1 && cmp > 0) approximate = String(pos)
    }
  }
  return matchType === 0 ? '#N/A' : approximate
}
