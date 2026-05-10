/**
 * Compute the SUM(...) range above a given row by walking up while cells are numeric.
 * Returns the formula to insert, or null if there's no numeric range above.
 */
export function autoSumFormula(col: string, row: number, display: (k: string) => string): string | null {
  let top = row - 1
  while (top >= 0 && /^-?\d/.test(display(`${col}${top + 1}`))) top -= 1
  const startRow0 = top + 1
  if (startRow0 >= row) return null
  return `=SUM(${col}${startRow0 + 1}:${col}${row})`
}
