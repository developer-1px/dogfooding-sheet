import { useEffect } from 'react'
import type { SheetOps } from '../schema'
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

const migrateLegacy = (hidden: HiddenState, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, !hidden.rows.length && !hidden.cols.length, ops,
    (raw) => {
      const o = raw as { rows?: unknown; cols?: unknown } | null
      const next: HiddenState = {
        rows: Array.isArray(o?.rows) ? o!.rows.filter((n: unknown) => typeof n === 'number') as number[] : [],
        cols: Array.isArray(o?.cols) ? o!.cols.filter((s: unknown) => typeof s === 'string') as string[] : [],
      }
      return next.rows.length || next.cols.length ? next : undefined
    },
    (o, v) => o.replace('/hidden', v),
  )

export function nextHiddenState(hidden: HiddenState, change: HiddenChange): HiddenState | null {
  if (change.type === 'hideRow') {
    if (hidden.rows.includes(change.row)) return null
    return { ...hidden, rows: [...hidden.rows, change.row] }
  }
  if (change.type === 'hideCol') {
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

export function useHidden(hidden: HiddenState, ops: SheetOps) {
  useEffect(() => { migrateLegacy(hidden, ops) }, [hidden, ops])

  const applyHiddenChange = (change: HiddenChange) => {
    const next = nextHiddenState(hidden, change)
    if (next) ops.replace('/hidden', next)
  }
  const hideRow = (row: number) => applyHiddenChange({ type: 'hideRow', row })
  const hideCol = (col: string) => applyHiddenChange({ type: 'hideCol', col })
  const showRow = (row: number) => applyHiddenChange({ type: 'showRow', row })
  const showCol = (col: string) => applyHiddenChange({ type: 'showCol', col })
  const showAll = () => applyHiddenChange({ type: 'showAll' })

  return {
    hidden,
    rowSet: new Set(hidden.rows),
    colSet: new Set(hidden.cols),
    hideRow, hideCol, showRow, showCol, showAll,
    hasHidden: hidden.rows.length + hidden.cols.length > 0,
  }
}
