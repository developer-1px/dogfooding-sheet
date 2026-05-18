import { COL_LETTERS, cellKey, colIndex, type Display } from '../coordinates/a1'
import { isNumeric } from './numeric'

export function autoSumFormula(col: string, row: number, display: Display): string | null {
  let top = row - 1
  while (top >= 0 && isNumeric(display(cellKey(col, top)))) top -= 1
  const startRow0 = top + 1
  if (startRow0 < row) return `=SUM(${col}${startRow0 + 1}:${col}${row})`

  const colIdx = colIndex(col)
  if (colIdx <= 0) return null
  let left = colIdx - 1
  while (left >= 0 && isNumeric(display(cellKey(COL_LETTERS[left], row)))) left -= 1
  const startCol = left + 1
  if (startCol < colIdx) return `=SUM(${COL_LETTERS[startCol]}${row + 1}:${COL_LETTERS[colIdx - 1]}${row + 1})`
  return null
}
