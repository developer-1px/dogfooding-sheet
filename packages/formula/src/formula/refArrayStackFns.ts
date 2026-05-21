import { splitArgs } from './args'
import { smartReturn } from './marker'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'
import { rangeMatrix, type RefCtx } from './refMatrix'

export function dispatchRefArrayStack(F: string, argsT: string[], rawArgs: string, c: RefCtx): string | null {
  if (F === 'HSTACK' || F === 'VSTACK') {
    const raw = splitArgs(rawArgs)
    if (raw.length === 0) return smartReturn('#REF!')
    const resolved: string[][][] = []
    let maxRows = 0
    let maxCols = 0
    let totalRows = 0
    let totalCols = 0
    for (const arg of raw) {
      const result = rangeMatrix(arg, c)
      if (!result.ok) return smartReturn(result.error)
      const matrix = result.matrix
      resolved.push(matrix)
      if (matrix.length > maxRows) maxRows = matrix.length
      if (matrix[0].length > maxCols) maxCols = matrix[0].length
      totalRows += matrix.length
      totalCols += matrix[0].length
    }
    if (F === 'HSTACK') {
      if (!isSafeArrayShape(maxRows, totalCols)) return smartReturn('#VALUE!')
      const rows: string[][] = []
      for (let row = 0; row < maxRows; row++) {
        const values: string[] = []
        for (const matrix of resolved) {
          const source = matrix[row]
          if (source) for (const value of source) values.push(value)
          else for (let col = 0; col < matrix[0].length; col++) values.push('#N/A')
        }
        rows.push(values)
      }
      return smartReturn(stringifyFormulaArray(rows))
    }
    if (!isSafeArrayShape(totalRows, maxCols)) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (const matrix of resolved) {
      for (const row of matrix) {
        const values: string[] = []
        for (const value of row) values.push(value)
        for (let col = row.length; col < maxCols; col++) values.push('#N/A')
        rows.push(values)
      }
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'ARRAY_CONSTRAIN') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const rowCount = Math.trunc(Number(argsT[1]))
    const colCount = Math.trunc(Number(argsT[2]))
    if (!Number.isFinite(rowCount) || !Number.isFinite(colCount) || rowCount < 1 || colCount < 1) return smartReturn('#VALUE!')
    return smartReturn(stringifyFormulaArray(matrix.slice(0, rowCount).map(row => row.slice(0, colCount))))
  }
  if (F === 'FLATTEN') {
    const raw = splitArgs(rawArgs)
    if (raw.length === 0) return smartReturn('#REF!')
    const matrices: string[][][] = []
    let cellCount = 0
    for (const arg of raw) {
      const result = rangeMatrix(arg, c)
      if (!result.ok) return smartReturn(result.error)
      const matrix = result.matrix
      matrices.push(matrix)
      cellCount += matrix.length * matrix[0].length
    }
    if (!isSafeArrayShape(cellCount, 1)) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (const matrix of matrices) {
      for (const row of matrix) {
        for (const value of row) rows.push([value])
      }
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  return null
}
