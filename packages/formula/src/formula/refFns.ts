import { splitArgs, type EvalCell } from './args'
import { COL_LETTERS, parseA1, cellKey, colIndex, type Cells } from '../a1'
import { evalCell as evalRangeCell, parseRange } from './rangeRect'
import { smartReturn } from './marker'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'


interface Ctx { cells: Cells; evalCell: EvalCell }

type MatrixResult =
  | { ok: true; matrix: string[][] }
  | { ok: false; error: '#REF!' | '#VALUE!' }

const rangeMatrix = (range: string, c: Ctx): MatrixResult => {
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

const flattenMatrix = (matrix: string[][], scanByColumn: boolean): string[] => {
  const values: string[] = []
  if (scanByColumn) {
    for (let col = 0; col < matrix[0].length; col++) {
      for (let row = 0; row < matrix.length; row++) values.push(matrix[row][col])
    }
    return values
  }
  for (const row of matrix) values.push(...row)
  return values
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
    const result = rangeMatrix((rawArgs ?? '').trim(), c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const rows: string[][] = []
    for (let col = 0; col < matrix[0].length; col++) {
      const row: string[] = []
      for (let rr = 0; rr < matrix.length; rr++) {
        row.push(matrix[rr][col])
      }
      rows.push(row)
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'SEQUENCE') {
    const rowCount = Math.trunc(Number(argsT[0]))
    const colCount = Math.trunc(Number(argsT[1] ?? '1'))
    const start = Number(argsT[2] ?? '1')
    const step = Number(argsT[3] ?? '1')
    if (
      !Number.isFinite(rowCount) || !Number.isFinite(colCount) ||
      !Number.isFinite(start) || !Number.isFinite(step) ||
      rowCount < 1 || colCount < 1 ||
      !isSafeArrayShape(rowCount, colCount)
    ) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const values: string[] = []
      for (let col = 0; col < colCount; col++) {
        values.push(String(start + (row * colCount + col) * step))
      }
      rows.push(values)
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'TAKE' || F === 'DROP') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
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
    return smartReturn(stringifyFormulaArray(sliced))
  }
  if (F === 'CHOOSEROWS' || F === 'CHOOSECOLS') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const picks = argsT.slice(1)
    if (picks.length === 0) return smartReturn('#VALUE!')
    if (F === 'CHOOSEROWS') {
      const rowIndexes = picks.map(pick => chooseIndex(matrix.length, pick))
      if (rowIndexes.some(index => index === null)) return smartReturn('#VALUE!')
      if (!isSafeArrayShape(rowIndexes.length, matrix[0].length)) return smartReturn('#VALUE!')
      return smartReturn(stringifyFormulaArray(rowIndexes.map(index => matrix[index as number])))
    }
    const colIndexes = picks.map(pick => chooseIndex(matrix[0].length, pick))
    if (colIndexes.some(index => index === null)) return smartReturn('#VALUE!')
    if (!isSafeArrayShape(matrix.length, colIndexes.length)) return smartReturn('#VALUE!')
    return smartReturn(stringifyFormulaArray(matrix.map(row => colIndexes.map(index => row[index as number]))))
  }
  if (F === 'TOCOL' || F === 'TOROW') {
    const raw = splitArgs(rawArgs)
    const matrixResult = rangeMatrix(raw[0] ?? '', c)
    if (!matrixResult.ok) return smartReturn(matrixResult.error)
    const matrix = matrixResult.matrix
    const scanByColumn = Math.trunc(Number(argsT[2] ?? '0')) === 1
    const values = flattenMatrix(matrix, scanByColumn)
    const array = F === 'TOCOL' ? values.map(value => [value]) : [values]
    return smartReturn(stringifyFormulaArray(array))
  }
  if (F === 'WRAPROWS' || F === 'WRAPCOLS') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const wrapCount = Math.trunc(Number(argsT[1]))
    if (!Number.isFinite(wrapCount) || wrapCount < 1) return smartReturn('#VALUE!')
    const values = flattenMatrix(matrix, false)
    const pad = argsT[2] ?? '#N/A'
    if (F === 'WRAPROWS') {
      if (!isSafeArrayShape(Math.ceil(values.length / wrapCount), wrapCount)) return smartReturn('#VALUE!')
      const rows: string[][] = []
      for (let index = 0; index < values.length; index += wrapCount) {
        const row = values.slice(index, index + wrapCount)
        while (row.length < wrapCount) row.push(pad)
        rows.push(row)
      }
      return smartReturn(stringifyFormulaArray(rows))
    }
    const rowCount = wrapCount
    const colCount = Math.ceil(values.length / rowCount)
    if (!isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
    const rows = Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => pad))
    values.forEach((value, index) => {
      rows[index % rowCount][Math.floor(index / rowCount)] = value
    })
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'EXPAND') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const rowCount = Math.trunc(Number(argsT[1]))
    const colCount = Math.trunc(Number(argsT[2] ?? String(matrix[0].length)))
    if (
      !Number.isFinite(rowCount) || !Number.isFinite(colCount) ||
      rowCount < matrix.length || colCount < matrix[0].length ||
      !isSafeArrayShape(rowCount, colCount)
    ) return smartReturn('#VALUE!')
    const pad = argsT[3] ?? '#N/A'
    const rows = Array.from({ length: rowCount }, (_unused, row) =>
      Array.from({ length: colCount }, (_unused2, col) => matrix[row]?.[col] ?? pad)
    )
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'HSTACK' || F === 'VSTACK') {
    const raw = splitArgs(rawArgs)
    if (raw.length === 0) return smartReturn('#REF!')
    const resolved: string[][][] = []
    for (const arg of raw) {
      const result = rangeMatrix(arg, c)
      if (!result.ok) return smartReturn(result.error)
      resolved.push(result.matrix)
    }
    if (F === 'HSTACK') {
      const rowCount = Math.max(...resolved.map(matrix => matrix.length))
      const colCount = resolved.reduce((sum, matrix) => sum + matrix[0].length, 0)
      if (!isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
      const rows = Array.from({ length: rowCount }, (_unused, row) =>
        resolved.flatMap(matrix => matrix[row] ?? Array.from({ length: matrix[0].length }, () => '#N/A'))
      )
      return smartReturn(stringifyFormulaArray(rows))
    }
    const colCount = Math.max(...resolved.map(matrix => matrix[0].length))
    const rowCount = resolved.reduce((sum, matrix) => sum + matrix.length, 0)
    if (!isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
    const rows = resolved.flatMap(matrix =>
      matrix.map(row => row.concat(Array.from({ length: colCount - row.length }, () => '#N/A')))
    )
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'ARRAY_CONSTRAIN') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const rowCount = Math.trunc(Number(argsT[1]))
    const colCount = Math.trunc(Number(argsT[2]))
    if (!Number.isFinite(rowCount) || !Number.isFinite(colCount) || rowCount < 1 || colCount < 1) {
      return smartReturn('#VALUE!')
    }
    return smartReturn(stringifyFormulaArray(matrix.slice(0, rowCount).map(row => row.slice(0, colCount))))
  }
  if (F === 'FLATTEN') {
    const raw = splitArgs(rawArgs)
    if (raw.length === 0) return smartReturn('#REF!')
    const matrices: string[][][] = []
    for (const arg of raw) {
      const result = rangeMatrix(arg, c)
      if (!result.ok) return smartReturn(result.error)
      matrices.push(result.matrix)
    }
    const values = matrices.flatMap(result => flattenMatrix(result, false))
    if (!isSafeArrayShape(values.length, 1)) return smartReturn('#VALUE!')
    return smartReturn(stringifyFormulaArray(values.map(value => [value])))
  }
  if (F === 'OFFSET') {
    const base = (rawArgs.split(',')[0] ?? '').trim()
    const p = parseA1(base)
    if (!p) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = colIndex(p.col) + dc, row = p.row + dr
    if (col < 0 || col > 9 || row < 0) return smartReturn('#REF!')
    const ref = cellKey(COL_LETTERS[col], row)
    return smartReturn(c.evalCell(ref))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    const p = parseA1(ref)
    if (!p) return smartReturn('#REF!')
    return smartReturn(c.evalCell(cellKey(p.col, p.row)))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  return null
}
