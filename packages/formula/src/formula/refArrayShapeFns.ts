import { splitArgs } from './args'
import { parseRange } from './rangeRect'
import { smartReturn } from './marker'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'
import { chooseIndex, dropCount, flattenMatrix, rangeMatrix, takeCount, type RefCtx } from './refMatrix'

export function dispatchRefArrayShape(F: string, argsT: string[], rawArgs: string, c: RefCtx): string | null {
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
      for (let rr = 0; rr < matrix.length; rr++) row.push(matrix[rr][col])
      rows.push(row)
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'SEQUENCE') {
    const rowCount = Math.trunc(Number(argsT[0]))
    const colCount = Math.trunc(Number(argsT[1] ?? '1'))
    const start = Number(argsT[2] ?? '1')
    const step = Number(argsT[3] ?? '1')
    if (!Number.isFinite(rowCount) || !Number.isFinite(colCount) || !Number.isFinite(start) || !Number.isFinite(step) || rowCount < 1 || colCount < 1 || !isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const values: string[] = []
      for (let col = 0; col < colCount; col++) values.push(String(start + (row * colCount + col) * step))
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
    const cols = argsT[2] === undefined ? [0, matrix[0].length] as [number, number] : F === 'TAKE' ? takeCount(matrix[0].length, Number(argsT[2])) : dropCount(matrix[0].length, Number(argsT[2]))
    if (!cols) return smartReturn('#VALUE!')
    return smartReturn(stringifyFormulaArray(matrix.slice(rows[0], rows[1]).map(row => row.slice(cols[0], cols[1]))))
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
      if (rowIndexes.some(index => index === null) || !isSafeArrayShape(rowIndexes.length, matrix[0].length)) return smartReturn('#VALUE!')
      return smartReturn(stringifyFormulaArray(rowIndexes.map(index => matrix[index as number])))
    }
    const colIndexes = picks.map(pick => chooseIndex(matrix[0].length, pick))
    if (colIndexes.some(index => index === null) || !isSafeArrayShape(matrix.length, colIndexes.length)) return smartReturn('#VALUE!')
    return smartReturn(stringifyFormulaArray(matrix.map(row => colIndexes.map(index => row[index as number]))))
  }
  if (F === 'TOCOL' || F === 'TOROW') {
    const raw = splitArgs(rawArgs)
    const matrixResult = rangeMatrix(raw[0] ?? '', c)
    if (!matrixResult.ok) return smartReturn(matrixResult.error)
    const values = flattenMatrix(matrixResult.matrix, Math.trunc(Number(argsT[2] ?? '0')) === 1)
    return smartReturn(stringifyFormulaArray(F === 'TOCOL' ? values.map(value => [value]) : [values]))
  }
  return null
}
