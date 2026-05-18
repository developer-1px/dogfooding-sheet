import { splitArgs, type Eval } from './args'
import { COL_LETTERS, parseA1, cellKey, colIndex, type Cells } from '../a1'
import { evalCell as evalRangeCell, parseRange } from './rangeRect'
import { smartReturn } from './marker'


interface Ctx { cells: Cells; evalRaw: Eval }

const rangeMatrix = (range: string, c: Ctx): string[][] | null => {
  const r = parseRange(range)
  if (!r) return null
  const rows: string[][] = []
  for (let rr = r.rMin; rr <= r.rMax; rr++) {
    const row: string[] = []
    for (let col = r.cMin; col <= r.cMax; col++) {
      row.push(evalRangeCell(c.cells, col, rr, c.evalRaw))
    }
    rows.push(row)
  }
  return rows
}

const takeCount = (size: number, count: number): [number, number] | null => {
  const n = Math.trunc(count)
  if (!Number.isFinite(n) || n === 0) return null
  const kept = Math.min(Math.abs(n), size)
  return n > 0 ? [0, kept] : [size - kept, size]
}

const dropCount = (size: number, count: number): [number, number] | null => {
  const n = Math.trunc(count)
  if (!Number.isFinite(n) || n === 0) return null
  const dropped = Math.min(Math.abs(n), size)
  return n > 0 ? [dropped, size] : [0, size - dropped]
}

const chooseIndex = (size: number, index: string): number | null => {
  const n = Math.trunc(Number(index))
  if (!Number.isFinite(n) || n === 0 || Math.abs(n) > size) return null
  return n > 0 ? n - 1 : size + n
}

export function dispatchRef(F: string, argsT: string[], rawArgs: string, c: Ctx): string | null {
  if (F === 'RANGEDIM') {
    const raw = (rawArgs ?? '').trim()
    const r = raw.includes(':') ? parseRange(raw) : null
    if (!r) return smartReturn('#REF!')
    return smartReturn(`${r.rMax - r.rMin + 1}×${r.cMax - r.cMin + 1}`)
  }
  if (F === 'ROWS' || F === 'COLUMNS') {
    const r = parseRange((rawArgs ?? '').trim())
    if (!r) return smartReturn('#REF!')
    return smartReturn(String(F === 'ROWS' ? r.rMax - r.rMin + 1 : r.cMax - r.cMin + 1))
  }
  if (F === 'TRANSPOSE') {
    const matrix = rangeMatrix((rawArgs ?? '').trim(), c)
    if (!matrix) return smartReturn('#REF!')
    const rows: string[][] = []
    for (let col = 0; col < matrix[0].length; col++) {
      const row: string[] = []
      for (let rr = 0; rr < matrix.length; rr++) {
        row.push(matrix[rr][col])
      }
      rows.push(row)
    }
    return smartReturn(JSON.stringify(rows))
  }
  if (F === 'SEQUENCE') {
    const rowCount = Math.trunc(Number(argsT[0]))
    const colCount = Math.trunc(Number(argsT[1] ?? '1'))
    const start = Number(argsT[2] ?? '1')
    const step = Number(argsT[3] ?? '1')
    if (
      !Number.isFinite(rowCount) || !Number.isFinite(colCount) ||
      !Number.isFinite(start) || !Number.isFinite(step) ||
      rowCount < 1 || colCount < 1
    ) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const values: string[] = []
      for (let col = 0; col < colCount; col++) {
        values.push(String(start + (row * colCount + col) * step))
      }
      rows.push(values)
    }
    return smartReturn(JSON.stringify(rows))
  }
  if (F === 'TAKE' || F === 'DROP') {
    const raw = splitArgs(rawArgs)
    const matrix = rangeMatrix(raw[0] ?? '', c)
    if (!matrix) return smartReturn('#REF!')
    const rows = F === 'TAKE' ? takeCount(matrix.length, Number(argsT[1])) : dropCount(matrix.length, Number(argsT[1]))
    if (!rows) return smartReturn('#VALUE!')
    const cols = argsT[2] === undefined
      ? [0, matrix[0].length] as [number, number]
      : F === 'TAKE'
        ? takeCount(matrix[0].length, Number(argsT[2]))
        : dropCount(matrix[0].length, Number(argsT[2]))
    if (!cols) return smartReturn('#VALUE!')
    const sliced = matrix
      .slice(rows[0], rows[1])
      .map(row => row.slice(cols[0], cols[1]))
    return smartReturn(JSON.stringify(sliced))
  }
  if (F === 'CHOOSEROWS' || F === 'CHOOSECOLS') {
    const raw = splitArgs(rawArgs)
    const matrix = rangeMatrix(raw[0] ?? '', c)
    if (!matrix) return smartReturn('#REF!')
    const picks = argsT.slice(1)
    if (picks.length === 0) return smartReturn('#VALUE!')
    if (F === 'CHOOSEROWS') {
      const rowIndexes = picks.map(pick => chooseIndex(matrix.length, pick))
      if (rowIndexes.some(index => index === null)) return smartReturn('#VALUE!')
      return smartReturn(JSON.stringify(rowIndexes.map(index => matrix[index as number])))
    }
    const colIndexes = picks.map(pick => chooseIndex(matrix[0].length, pick))
    if (colIndexes.some(index => index === null)) return smartReturn('#VALUE!')
    return smartReturn(JSON.stringify(matrix.map(row => colIndexes.map(index => row[index as number]))))
  }
  if (F === 'OFFSET') {
    const base = (rawArgs.split(',')[0] ?? '').trim()
    const p = parseA1(base)
    if (!p) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = colIndex(p.col) + dc, row = p.row + dr
    if (col < 0 || col > 9 || row < 0) return smartReturn('#REF!')
    const ref = cellKey(COL_LETTERS[col], row)
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    const p = parseA1(ref)
    if (!p) return smartReturn('#REF!')
    return smartReturn(c.evalRaw(c.cells[cellKey(p.col, p.row)] ?? ''))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  return null
}
