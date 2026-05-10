import { parseRange, evalCell } from './rangeRect'

type Cells = Record<string, string>

export { parseRange }

export function vlookup(
  key: string,
  rangeStr: string,
  colIdx: number,
  cells: Cells,
  evalRaw: (s: string) => string,
): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetCol = r.cMin + colIdx - 1
  if (targetCol > r.cMax) return '#REF!'
  for (let row = r.rMin; row <= r.rMax; row++) {
    if (evalCell(cells, r.cMin, row, evalRaw) === key) {
      return evalCell(cells, targetCol, row, evalRaw)
    }
  }
  return '#N/A'
}

export function hlookup(
  key: string,
  rangeStr: string,
  rowIdx: number,
  cells: Cells,
  evalRaw: (s: string) => string,
): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const targetRow = r.rMin + rowIdx - 1
  if (targetRow > r.rMax) return '#REF!'
  for (let col = r.cMin; col <= r.cMax; col++) {
    if (evalCell(cells, col, r.rMin, evalRaw) === key) {
      return evalCell(cells, col, targetRow, evalRaw)
    }
  }
  return '#N/A'
}

export function xlookup(
  key: string,
  lookupRangeStr: string,
  resultRangeStr: string,
  ifNotFound: string | undefined,
  cells: Cells,
  evalRaw: (s: string) => string,
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

export function index(rangeStr: string, row: number, col: number, cells: Cells, evalRaw: (s: string) => string): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  const tr = r.rMin + row - 1
  const tc = r.cMin + col - 1
  if (tr > r.rMax || tc > r.cMax || tr < r.rMin || tc < r.cMin) return '#REF!'
  return evalCell(cells, tc, tr, evalRaw)
}

export function match(key: string, rangeStr: string, cells: Cells, evalRaw: (s: string) => string): string {
  const r = parseRange(rangeStr)
  if (!r) return '#REF!'
  let pos = 0
  for (let row = r.rMin; row <= r.rMax; row++) {
    for (let col = r.cMin; col <= r.cMax; col++) {
      pos++
      if (evalCell(cells, col, row, evalRaw) === key) return String(pos)
    }
  }
  return '#N/A'
}
