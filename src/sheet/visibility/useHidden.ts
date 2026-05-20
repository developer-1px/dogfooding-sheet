import { useEffect, useMemo } from 'react'
import { colIndex, MAX_COL_COUNT, MAX_ROW_COUNT, type SheetOps } from '../schema'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export interface HiddenState {
  rows: number[]
  cols: string[]
}

type HiddenChange =
  | { type: 'hideRow'; row: number }
  | { type: 'hideCol'; col: string }
  | { type: 'showRow'; row: number }
  | { type: 'showCol'; col: string }
  | { type: 'showAll' }

export interface HiddenActions {
  hideRow: (row: number) => void
  hideCol: (col: string) => void
  showRow: (row: number) => void
  showCol: (col: string) => void
  showAll: () => void
}

const LEGACY_KEY = 'spreadsheet:hidden:v1'

interface HiddenBounds {
  rowCount: number
  colCount: number
}

const defaultHiddenBounds = (bounds?: HiddenBounds): HiddenBounds => ({
  rowCount: bounds?.rowCount ?? MAX_ROW_COUNT,
  colCount: bounds?.colCount ?? MAX_COL_COUNT,
})

const validHiddenRow = (row: unknown, bounds: HiddenBounds): row is number =>
  typeof row === 'number' && Number.isInteger(row) && row >= 0 && row < bounds.rowCount

const validHiddenCol = (col: unknown, bounds: HiddenBounds): col is string => {
  if (typeof col !== 'string') return false
  const index = colIndex(col)
  return index >= 0 && index < bounds.colCount
}

export const normalizeHiddenState = (
  hidden: { rows?: unknown; cols?: unknown },
  bounds?: HiddenBounds,
): HiddenState => {
  const nextBounds = defaultHiddenBounds(bounds)
  const rows = Array.isArray(hidden.rows) ? hidden.rows.filter((row) => validHiddenRow(row, nextBounds)) : []
  const cols = Array.isArray(hidden.cols) ? hidden.cols.filter((col) => validHiddenCol(col, nextBounds)) : []
  return {
    rows: [...new Set(rows)].sort((a, b) => a - b),
    cols: [...new Set(cols)],
  }
}

export const coerceLegacyHidden = (raw: unknown, bounds?: HiddenBounds): HiddenState | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const next = normalizeHiddenState(raw, bounds)
  return next.rows.length || next.cols.length ? next : undefined
}

const migrateLegacy = (hidden: HiddenState, ops: SheetOps, bounds?: HiddenBounds) =>
  migrateLegacyKey(LEGACY_KEY, !hidden.rows.length && !hidden.cols.length, ops,
    (raw) => coerceLegacyHidden(raw, bounds),
    (o, v) => o.replace('/hidden', v),
  )

export function nextHiddenState(hidden: HiddenState, change: HiddenChange, bounds?: HiddenBounds): HiddenState | null {
  const nextBounds = defaultHiddenBounds(bounds)
  if (change.type === 'hideRow') {
    if (!validHiddenRow(change.row, nextBounds)) return null
    if (hidden.rows.includes(change.row)) return null
    return { ...hidden, rows: [...hidden.rows, change.row] }
  }
  if (change.type === 'hideCol') {
    if (!validHiddenCol(change.col, nextBounds)) return null
    if (hidden.cols.includes(change.col)) return null
    return { ...hidden, cols: [...hidden.cols, change.col] }
  }
  if (change.type === 'showRow') {
    if (!hidden.rows.includes(change.row)) return null
    return { ...hidden, rows: hidden.rows.filter((row) => row !== change.row) }
  }
  if (change.type === 'showCol') {
    if (!hidden.cols.includes(change.col)) return null
    return { ...hidden, cols: hidden.cols.filter((col) => col !== change.col) }
  }
  if (!hidden.rows.length && !hidden.cols.length) return null
  return { rows: [], cols: [] }
}

export function useHidden(hidden: HiddenState, ops: SheetOps, bounds?: HiddenBounds) {
  const rowCount = bounds?.rowCount ?? MAX_ROW_COUNT
  const colCount = bounds?.colCount ?? MAX_COL_COUNT
  const current = useMemo(() => normalizeHiddenState(hidden, { rowCount, colCount }), [hidden, rowCount, colCount])

  useEffect(() => { migrateLegacy(current, ops, { rowCount, colCount }) }, [current, ops, rowCount, colCount])

  const applyHiddenChange = (change: HiddenChange) => {
    const next = nextHiddenState(current, change, { rowCount, colCount })
    if (next) ops.replace('/hidden', next)
  }
  const hideRow = (row: number) => applyHiddenChange({ type: 'hideRow', row })
  const hideCol = (col: string) => applyHiddenChange({ type: 'hideCol', col })
  const showRow = (row: number) => applyHiddenChange({ type: 'showRow', row })
  const showCol = (col: string) => applyHiddenChange({ type: 'showCol', col })
  const showAll = () => applyHiddenChange({ type: 'showAll' })

  return {
    hidden: current,
    rowSet: new Set(current.rows),
    colSet: new Set(current.cols),
    hideRow, hideCol, showRow, showCol, showAll,
    hasHidden: current.rows.length + current.cols.length > 0,
  }
}
