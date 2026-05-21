import type { EvalCell } from './args'
import { type Cells } from '../a1'
import { evalCell as evalRangeCell, parseRange } from './rangeRect'
import { isSafeArrayShape } from './arraySafety'

export interface RefCtx {
  cells: Cells
  evalCell: EvalCell
}

export type MatrixResult =
  | { ok: true; matrix: string[][] }
  | { ok: false; error: '#REF!' | '#VALUE!' }

export const rangeMatrix = (range: string, c: RefCtx): MatrixResult => {
  const r = parseRange(range)
  if (!r) return { ok: false, error: '#REF!' }
  const rowCount = r.rMax - r.rMin + 1
  const colCount = r.cMax - r.cMin + 1
  if (!isSafeArrayShape(rowCount, colCount)) return { ok: false, error: '#VALUE!' }
  const rows: string[][] = []
  for (let rr = r.rMin; rr <= r.rMax; rr++) {
    const row: string[] = []
    for (let col = r.cMin; col <= r.cMax; col++) {
      row.push(evalRangeCell(c.cells, col, rr, c.evalCell))
    }
    rows.push(row)
  }
  return { ok: true, matrix: rows }
}

export const takeCount = (size: number, count: number): [number, number] | null => {
  const n = Math.trunc(count)
  if (!Number.isFinite(n) || n === 0) return null
  const kept = Math.min(Math.abs(n), size)
  return n > 0 ? [0, kept] : [size - kept, size]
}

export const dropCount = (size: number, count: number): [number, number] | null => {
  const n = Math.trunc(count)
  if (!Number.isFinite(n) || n === 0) return null
  const dropped = Math.min(Math.abs(n), size)
  return n > 0 ? [dropped, size] : [0, size - dropped]
}

export const chooseIndex = (size: number, index: string): number | null => {
  const n = Math.trunc(Number(index))
  if (!Number.isFinite(n) || n === 0 || Math.abs(n) > size) return null
  return n > 0 ? n - 1 : size + n
}

export const flattenMatrix = (matrix: string[][], scanByColumn: boolean): string[] => {
  const values: string[] = []
  if (scanByColumn) {
    for (let col = 0; col < matrix[0].length; col++) {
      for (let row = 0; row < matrix.length; row++) values.push(matrix[row][col])
    }
    return values
  }
  for (const row of matrix) {
    for (const value of row) values.push(value)
  }
  return values
}
