import type { Eval } from './args'
import type { Cells } from '../a1'
import { parseRange, evalCell } from './rangeRect'
import { coerceNumber } from './coerce'
import { wildcardToRegex } from './criteriaMatch'


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

const lookupVector = (rangeStr: string, cells: Cells, evalRaw: Eval): { values: string[], rowMode: boolean } | string => {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const rows = r.rMax - r.rMin + 1
  const cols = r.cMax - r.cMin + 1
  if (rows > 1 && cols > 1) return '#VALUE!'
  const rowMode = rows > 1
  const len = rowMode ? rows : cols
  const values = Array.from({ length: len }, (_v, i) => evalCell(cells, rowMode ? r.cMin : r.cMin + i, rowMode ? r.rMin + i : r.rMin, evalRaw))
  return { values, rowMode }
}

const lookupIndex = (key: string, values: string[], matchMode: number, searchMode: number): number | string => {
  if (![-1, 0, 1, 2].includes(matchMode) || ![1, -1, 2, -2].includes(searchMode)) return '#VALUE!'
  const reverse = searchMode === -1 || searchMode === -2
  const wildcard = matchMode === 2 ? wildcardToRegex(key) : null
  const ordered = Array.from({ length: values.length }, (_v, i) => reverse ? values.length - 1 - i : i)
  let best = -1
  for (const i of ordered) {
    const value = values[i]
    if (wildcard?.test(value)) return i
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) return i
    if (matchMode === -1 && cmp < 0 && (best < 0 || compareLookupValues(value, values[best]) > 0)) best = i
    if (matchMode === 1 && cmp > 0 && (best < 0 || compareLookupValues(value, values[best]) < 0)) best = i
  }
  return best >= 0 ? best : '#N/A'
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
  matchMode = 0,
  searchMode = 1,
): string {
  const L = lookupVector(lookupRangeStr, cells, evalRaw)
  const R = parseRange(resultRangeStr)
  if (typeof L === 'string' || !R) return typeof L === 'string' ? L : '#REF!'
  const rowMode = L.rowMode
  const len = L.values.length
  const resultLen = rowMode ? R.rMax - R.rMin + 1 : R.cMax - R.cMin + 1
  if (resultLen !== len) return '#VALUE!'
  const i = lookupIndex(key, L.values, matchMode, searchMode)
  if (typeof i === 'string') return i === '#N/A' ? (ifNotFound ?? '#N/A') : i
  return evalCell(cells, rowMode ? R.cMin : R.cMin + i, rowMode ? R.rMin + i : R.rMin, evalRaw)
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

export function xmatch(key: string, rangeStr: string, cells: Cells, evalRaw: Eval, matchMode = 0, searchMode = 1): string {
  const vector = lookupVector(rangeStr, cells, evalRaw)
  if (typeof vector === 'string') return vector
  const i = lookupIndex(key, vector.values, matchMode, searchMode)
  return typeof i === 'string' ? i : String(i + 1)
}
