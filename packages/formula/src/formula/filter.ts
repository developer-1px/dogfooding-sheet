import type { Cells } from '../a1'
import { COL_LETTERS, cellKey } from '../a1'
import type { Eval } from './args'
import { coerceNumber } from './coerce'
import { parseRange } from './rangeRect'

const isTruthy = (value: string): boolean => {
  if (/^true$/i.test(value)) return true
  if (/^false$/i.test(value)) return false
  const n = coerceNumber(value)
  return Number.isFinite(n) ? n !== 0 : value !== ''
}

export function filterRange(rangeStr: string, conditionStr: string, cells: Cells, evalRaw: Eval): string {
  const range = parseRange(rangeStr)
  const condition = parseRange(conditionStr)
  if (!range || !condition) return '#REF!'

  const rows = range.rMax - range.rMin + 1
  const cols = range.cMax - range.cMin + 1
  const condRows = condition.rMax - condition.rMin + 1
  const condCols = condition.cMax - condition.cMin + 1

  const rowFilter = condRows === rows && condCols === 1
  const colFilter = condRows === 1 && condCols === cols
  if (!rowFilter && !colFilter) return '#VALUE!'

  if (rowFilter) {
    const out: string[][] = []
    for (let r = 0; r < rows; r++) {
      const keep = isTruthy(evalRaw(cells[cellKey(COL_LETTERS[condition.cMin], condition.rMin + r)] ?? ''))
      if (!keep) continue
      const row: string[] = []
      for (let c = 0; c < cols; c++) row.push(evalRaw(cells[cellKey(COL_LETTERS[range.cMin + c], range.rMin + r)] ?? ''))
      out.push(row)
    }
    if (out.length === 0) return '#N/A'
    return JSON.stringify(cols === 1 ? out.map((row) => row[0]) : out)
  }

  const out: string[][] = []
  for (let r = 0; r < rows; r++) {
    const row: string[] = []
    for (let c = 0; c < cols; c++) {
      const keep = isTruthy(evalRaw(cells[cellKey(COL_LETTERS[condition.cMin + c], condition.rMin)] ?? ''))
      if (keep) row.push(evalRaw(cells[cellKey(COL_LETTERS[range.cMin + c], range.rMin + r)] ?? ''))
    }
    out.push(row)
  }
  return out.some((row) => row.length > 0) ? JSON.stringify(rows === 1 ? out[0] : out) : '#N/A'
}
