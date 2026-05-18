import { A1_RE, COL_LETTERS, colIndex } from '../coordinates/a1'

const idxCol = (i: number) => COL_LETTERS[i]

export function shiftFormulaRows(raw: string, fromRow: number, delta: 1 | -1, rowCount = Infinity): string {
  if (!raw.startsWith('=')) return raw
  return '=' + raw.slice(1).replace(A1_RE, (match, col: string, rowText: string) => {
    const row1 = Number(rowText)
    const row0 = row1 - 1
    if (delta < 0 && row0 === fromRow) return '#REF!'
    if (row0 < fromRow) return match
    const nextRow1 = row1 + delta
    if (nextRow1 < 1 || nextRow1 > rowCount) return '#REF!'
    return `${col}${nextRow1}`
  })
}

export function shiftFormulaCols(raw: string, fromCol: number, delta: 1 | -1): string {
  if (!raw.startsWith('=')) return raw
  return '=' + raw.slice(1).replace(A1_RE, (match, col: string, rowText: string) => {
    const ci = colIndex(col)
    if (delta < 0 && ci === fromCol) return '#REF!'
    if (ci < fromCol) return match
    const nextCol = idxCol(ci + delta)
    return nextCol ? `${nextCol}${rowText}` : '#REF!'
  })
}

export function offsetFormulaRefs(raw: string, dRows: number, dCols: number, rowCount = Infinity): string {
  if (!raw.startsWith('=')) return raw
  return '=' + raw.slice(1).replace(A1_RE, (_match, col: string, rowText: string) => {
    const nextRow1 = Number(rowText) + dRows
    const nextCol = idxCol(colIndex(col) + dCols)
    if (nextRow1 < 1 || nextRow1 > rowCount || !nextCol) return '#REF!'
    return `${nextCol}${nextRow1}`
  })
}
