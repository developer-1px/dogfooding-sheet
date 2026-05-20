import type { EvalCell } from './args'
import type { Cells } from '../a1'
import { parseRange, evalCell } from './rangeRect'
import { coerceNumber } from './coerce'
import { compileWildcardMatcher } from './criteriaMatch'


export { parseRange }

const isExactLookup = (rangeLookup: string | undefined): boolean => {
  const value = (rangeLookup ?? '').trim().replace(/^"|"$/g, '').toLowerCase()
  return value === '0' || value === 'false'
}

const valueError = (): string => '#VALUE!'
const hasArg = (value: string | undefined): value is string => value !== undefined
const hasRangeArg = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim() !== ''
const integerArg = (value: number): number | null =>
  Number.isFinite(value) && Number.isInteger(value) ? value : null

const compareLookupValues = (a: string, b: string): number => {
  const an = coerceNumber(a)
  const bn = coerceNumber(b)
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
}

const lookupVector = (rangeStr: string | undefined, cells: Cells, evalCellRef: EvalCell): { values: string[], rowMode: boolean } | string => {
  if (!hasRangeArg(rangeStr)) return valueError()
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const rows = r.rMax - r.rMin + 1
  const cols = r.cMax - r.cMin + 1
  if (rows > 1 && cols > 1) return '#VALUE!'
  const rowMode = rows > 1
  const len = rowMode ? rows : cols
  const values: string[] = []
  for (let i = 0; i < len; i++) {
    values.push(evalCell(cells, rowMode ? r.cMin : r.cMin + i, rowMode ? r.rMin + i : r.rMin, evalCellRef))
  }
  return { values, rowMode }
}

const lookupIndex = (key: string, values: string[], matchMode: number, searchMode: number): number | string => {
  if (![-1, 0, 1, 2].includes(matchMode) || ![1, -1, 2, -2].includes(searchMode)) return '#VALUE!'
  const reverse = searchMode === -1 || searchMode === -2
  const wildcard = matchMode === 2 ? compileWildcardMatcher(key) : null
  let best = -1
  for (let i = reverse ? values.length - 1 : 0; reverse ? i >= 0 : i < values.length; i += reverse ? -1 : 1) {
    const value = values[i]
    if (wildcard?.(value)) return i
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) return i
    if (matchMode === -1 && cmp < 0 && (best < 0 || compareLookupValues(value, values[best]) > 0)) best = i
    if (matchMode === 1 && cmp > 0 && (best < 0 || compareLookupValues(value, values[best]) < 0)) best = i
  }
  return best >= 0 ? best : '#N/A'
}

export function vlookup(
  key: string | undefined,
  rangeStr: string | undefined,
  colIdx: number,
  cells: Cells,
  evalCellRef: EvalCell,
  rangeLookup?: string,
): string {
  if (!hasArg(key) || !hasRangeArg(rangeStr)) return valueError()
  const colIndexArg = integerArg(colIdx)
  if (colIndexArg === null) return valueError()
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetCol = r.cMin + colIndexArg - 1
  if (colIndexArg < 1) return valueError()
  if (targetCol > r.cMax) return '#REF!'
  let approximate = '#N/A'
  for (let row = r.rMin; row <= r.rMax; row++) {
    const value = evalCell(cells, r.cMin, row, evalCellRef)
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) {
      return evalCell(cells, targetCol, row, evalCellRef)
    }
    if (!isExactLookup(rangeLookup) && cmp < 0) approximate = evalCell(cells, targetCol, row, evalCellRef)
  }
  return isExactLookup(rangeLookup) ? '#N/A' : approximate
}

export function hlookup(
  key: string | undefined,
  rangeStr: string | undefined,
  rowIdx: number,
  cells: Cells,
  evalCellRef: EvalCell,
  rangeLookup?: string,
): string {
  if (!hasArg(key) || !hasRangeArg(rangeStr)) return valueError()
  const rowIndexArg = integerArg(rowIdx)
  if (rowIndexArg === null) return valueError()
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetRow = r.rMin + rowIndexArg - 1
  if (rowIndexArg < 1) return valueError()
  if (targetRow > r.rMax) return '#REF!'
  let approximate = '#N/A'
  for (let col = r.cMin; col <= r.cMax; col++) {
    const value = evalCell(cells, col, r.rMin, evalCellRef)
    const cmp = compareLookupValues(value, key)
    if (cmp === 0) {
      return evalCell(cells, col, targetRow, evalCellRef)
    }
    if (!isExactLookup(rangeLookup) && cmp < 0) approximate = evalCell(cells, col, targetRow, evalCellRef)
  }
  return isExactLookup(rangeLookup) ? '#N/A' : approximate
}

export function xlookup(
  key: string | undefined,
  lookupRangeStr: string | undefined,
  resultRangeStr: string | undefined,
  ifNotFound: string | undefined,
  cells: Cells,
  evalCellRef: EvalCell,
  matchMode = 0,
  searchMode = 1,
): string {
  if (!hasArg(key) || !hasRangeArg(lookupRangeStr) || !hasRangeArg(resultRangeStr)) return valueError()
  if (!Number.isFinite(matchMode) || !Number.isFinite(searchMode)) return valueError()
  const L = lookupVector(lookupRangeStr, cells, evalCellRef)
  const R = parseRange(resultRangeStr)
  if (typeof L === 'string' || !R) return typeof L === 'string' ? L : '#REF!'
  const rowMode = L.rowMode
  const len = L.values.length
  const resultLen = rowMode ? R.rMax - R.rMin + 1 : R.cMax - R.cMin + 1
  if (resultLen !== len) return '#VALUE!'
  const i = lookupIndex(key, L.values, matchMode, searchMode)
  if (typeof i === 'string') return i === '#N/A' ? (ifNotFound ?? '#N/A') : i
  return evalCell(cells, rowMode ? R.cMin : R.cMin + i, rowMode ? R.rMin + i : R.rMin, evalCellRef)
}

export function index(rangeStr: string | undefined, row: number, col: number, cells: Cells, evalCellRef: EvalCell): string {
  if (!hasRangeArg(rangeStr)) return valueError()
  const rowArg = integerArg(row)
  const colArg = integerArg(col)
  if (rowArg === null || colArg === null) return valueError()
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const tr = r.rMin + rowArg - 1
  const tc = r.cMin + colArg - 1
  if (tr > r.rMax || tc > r.cMax || tr < r.rMin || tc < r.cMin) return '#REF!'
  return evalCell(cells, tc, tr, evalCellRef)
}

export function match(key: string | undefined, rangeStr: string | undefined, cells: Cells, evalCellRef: EvalCell, matchType = 1): string {
  if (!hasArg(key) || !hasRangeArg(rangeStr)) return valueError()
  if (!Number.isFinite(matchType) || !Number.isInteger(matchType)) return valueError()
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  let pos = 0
  let approximate = '#N/A'
  if (![1, 0, -1].includes(matchType)) return '#VALUE!'
  for (let row = r.rMin; row <= r.rMax; row++) {
    for (let col = r.cMin; col <= r.cMax; col++) {
      pos++
      const cmp = compareLookupValues(evalCell(cells, col, row, evalCellRef), key)
      if (cmp === 0) return String(pos)
      if (matchType === 1 && cmp < 0) approximate = String(pos)
      if (matchType === -1 && cmp > 0) approximate = String(pos)
    }
  }
  return matchType === 0 ? '#N/A' : approximate
}

export function xmatch(key: string | undefined, rangeStr: string | undefined, cells: Cells, evalCellRef: EvalCell, matchMode = 0, searchMode = 1): string {
  if (!hasArg(key) || !hasRangeArg(rangeStr)) return valueError()
  if (!Number.isFinite(matchMode) || !Number.isFinite(searchMode)) return valueError()
  const vector = lookupVector(rangeStr, cells, evalCellRef)
  if (typeof vector === 'string') return vector
  const i = lookupIndex(key, vector.values, matchMode, searchMode)
  return typeof i === 'string' ? i : String(i + 1)
}
