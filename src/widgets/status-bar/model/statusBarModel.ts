import { numericValue } from '@spredsheet/grid'
import { cellKey, type CellRef, type Display } from '../../../entities/Sheet/schema'

export interface StatusBarModelProps {
  selectedIds: string[]
  focusId: string | null
  rowCount: number
  colCount: number
  display: Display
  parseId: (id: string) => CellRef | null
}

interface NumericSummary {
  sum: number
  avg: number
  min: number
  max: number
  count: number
  median: number
}

interface StatusBarViewModel {
  summary: string
  showDetails: boolean
  nonEmpty: number
  numeric: NumericSummary | null
}

export const statusBarViewModel = ({ selectedIds, focusId, rowCount, colCount, display, parseId }: StatusBarModelProps): StatusBarViewModel => {
  const ids = selectedIds.length > 0 ? selectedIds : (focusId ? [focusId] : [])
  if (ids.length < 2) return { summary: `${ids.length} 셀`, showDetails: false, nonEmpty: 0, numeric: null }

  const rows = new Set<number>(), cols = new Set<string>()
  const numericValues: number[] = []
  let nonEmpty = 0
  let sum = 0
  let min = 0
  let max = 0
  for (const id of ids) {
    const p = parseId(id)
    if (!p) continue
    rows.add(p.row); cols.add(p.col)
    const v = display(cellKey(p.col, p.row))
    const trimmed = v.trim()
    if (trimmed !== '') nonEmpty++
    else continue
    const n = numericValue(v)
    if (!Number.isFinite(n)) continue
    if (numericValues.length === 0) {
      min = n
      max = n
    } else {
      if (n < min) min = n
      if (n > max) max = n
    }
    numericValues.push(n)
    sum += n
  }
  numericValues.sort((a, b) => a - b)
  const count = numericValues.length
  const median = count
    ? count % 2 ? numericValues[(count - 1) / 2] : (numericValues[count / 2 - 1] + numericValues[count / 2]) / 2
    : 0
  const fullRows = rows.size === rowCount
  const fullCols = cols.size === colCount
  const summary = fullRows && fullCols
    ? `전체 시트 (${ids.length} 셀)`
    : fullRows
      ? `${cols.size}열 선택 (${ids.length} 셀)`
      : fullCols
        ? `${rows.size}행 선택 (${ids.length} 셀)`
        : `${ids.length} 셀 (${rows.size}행 × ${cols.size}열)`

  return {
    summary,
    showDetails: true,
    nonEmpty,
    numeric: count > 0 ? { sum, avg: sum / count, min, max, count, median } : null,
  }
}
