import { cellKey, parseA1, type Cells } from '../coordinates/a1'
import { shiftFormulaRows } from './formulaRefs'

export function insertRow(cells: Cells, atRow: number, rowCount: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const { row, col } = p
    const shifted = shiftFormulaRows(v, atRow, 1, rowCount)
    if (row < atRow) next[k] = shifted
    else if (row + 1 < rowCount) next[cellKey(col, row + 1)] = shifted
  }
  return next
}

export function deleteRow(cells: Cells, atRow: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const { row, col } = p
    if (row === atRow) continue
    let shifted = v
    if (v.startsWith('=')) {
      shifted = shiftFormulaRows(v, atRow, -1)
    }
    if (row < atRow) next[k] = shifted
    else next[cellKey(col, row - 1)] = shifted
  }
  return next
}
