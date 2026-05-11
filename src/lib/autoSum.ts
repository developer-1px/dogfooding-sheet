import { isNumeric } from './numeric'
import { COL_LETTERS, colIndex } from './a1'

/**
 * SUM of contiguous numeric cells above the given row. Falls back to the
 * contiguous numeric run to the left if nothing is above (Sheets parity).
 */
export function autoSumFormula(col: string, row: number, display: (k: string) => string): string | null {
  let top = row - 1
  while (top >= 0 && isNumeric(display(`${col}${top + 1}`))) top -= 1
  const startRow0 = top + 1
  if (startRow0 < row) return `=SUM(${col}${startRow0 + 1}:${col}${row})`

  const colIdx = colIndex(col)
  if (colIdx <= 0) return null
  let left = colIdx - 1
  while (left >= 0 && isNumeric(display(`${COL_LETTERS[left]}${row + 1}`))) left -= 1
  const startCol = left + 1
  if (startCol < colIdx) return `=SUM(${COL_LETTERS[startCol]}${row + 1}:${COL_LETTERS[colIdx - 1]}${row + 1})`
  return null
}
