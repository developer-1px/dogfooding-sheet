type Cells = Record<string, string>

interface RangeRect { rMin: number; rMax: number; cMin: number; cMax: number }

export const parseRange = (s: string): RangeRect | null => {
  const m = /^([A-J])(\d+):([A-J])(\d+)$/.exec(s.trim())
  if (!m) {
    const single = /^([A-J])(\d+)$/.exec(s.trim())
    if (!single) return null
    const c = single[1].charCodeAt(0) - 65
    const r = Number(single[2]) - 1
    return { rMin: r, rMax: r, cMin: c, cMax: c }
  }
  const c1 = m[1].charCodeAt(0) - 65
  const c2 = m[3].charCodeAt(0) - 65
  return {
    rMin: Math.min(Number(m[2]), Number(m[4])) - 1,
    rMax: Math.max(Number(m[2]), Number(m[4])) - 1,
    cMin: Math.min(c1, c2),
    cMax: Math.max(c1, c2),
  }
}

const cellAt = (cells: Cells, c: number, r: number): string =>
  cells[`${String.fromCharCode(65 + c)}${r + 1}`] ?? ''

const evalCell = (cells: Cells, c: number, r: number, evalRaw: (s: string) => string): string =>
  evalRaw(cellAt(cells, c, r))

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
  // Search row-major within the range
  let pos = 0
  for (let row = r.rMin; row <= r.rMax; row++) {
    for (let col = r.cMin; col <= r.cMax; col++) {
      pos++
      if (evalCell(cells, col, row, evalRaw) === key) return String(pos)
    }
  }
  return '#N/A'
}
