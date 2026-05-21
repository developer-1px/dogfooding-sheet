import { splitArgs } from './args'
import { smartReturn } from './marker'
import { isSafeArrayShape, stringifyFormulaArray } from './arraySafety'
import { flattenMatrix, rangeMatrix, type RefCtx } from './refMatrix'

export function dispatchRefArrayWrap(F: string, argsT: string[], rawArgs: string, c: RefCtx): string | null {
  if (F === 'WRAPROWS' || F === 'WRAPCOLS') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const wrapCount = Math.trunc(Number(argsT[1]))
    if (!Number.isFinite(wrapCount) || wrapCount < 1) return smartReturn('#VALUE!')
    const values = flattenMatrix(result.matrix, false)
    const pad = argsT[2] ?? '#N/A'
    if (F === 'WRAPROWS') {
      if (!isSafeArrayShape(Math.ceil(values.length / wrapCount), wrapCount)) return smartReturn('#VALUE!')
      const rows: string[][] = []
      for (let index = 0; index < values.length; index += wrapCount) {
        const row: string[] = []
        const end = Math.min(index + wrapCount, values.length)
        for (let valueIndex = index; valueIndex < end; valueIndex++) row.push(values[valueIndex])
        while (row.length < wrapCount) row.push(pad)
        rows.push(row)
      }
      return smartReturn(stringifyFormulaArray(rows))
    }
    const rowCount = wrapCount
    const colCount = Math.ceil(values.length / rowCount)
    if (!isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const outputRow: string[] = []
      for (let col = 0; col < colCount; col++) {
        const index = col * rowCount + row
        outputRow.push(index < values.length ? values[index] : pad)
      }
      rows.push(outputRow)
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  if (F === 'EXPAND') {
    const raw = splitArgs(rawArgs)
    const result = rangeMatrix(raw[0] ?? '', c)
    if (!result.ok) return smartReturn(result.error)
    const matrix = result.matrix
    const rowCount = Math.trunc(Number(argsT[1]))
    const colCount = Math.trunc(Number(argsT[2] ?? String(matrix[0].length)))
    if (!Number.isFinite(rowCount) || !Number.isFinite(colCount) || rowCount < matrix.length || colCount < matrix[0].length || !isSafeArrayShape(rowCount, colCount)) return smartReturn('#VALUE!')
    const pad = argsT[3] ?? '#N/A'
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const source = matrix[row]
      const values: string[] = []
      if (source) {
        for (let col = 0; col < source.length; col++) values.push(source[col])
        for (let col = source.length; col < colCount; col++) values.push(pad)
      } else {
        for (let col = 0; col < colCount; col++) values.push(pad)
      }
      rows.push(values)
    }
    return smartReturn(stringifyFormulaArray(rows))
  }
  return null
}
