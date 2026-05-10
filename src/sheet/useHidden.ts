import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

export interface HiddenState {
  rows: number[]
  cols: string[]
}

const LEGACY_KEY = 'spreadsheet:hidden:v1'

function migrateLegacy(hidden: HiddenState, ops: JsonOps<Sheet>) {
  if (hidden.rows.length || hidden.cols.length) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    const next: HiddenState = {
      rows: Array.isArray(obj?.rows) ? obj.rows.filter((n: unknown) => typeof n === 'number') : [],
      cols: Array.isArray(obj?.cols) ? obj.cols.filter((s: unknown) => typeof s === 'string') : [],
    }
    if (next.rows.length || next.cols.length) ops.replace('/hidden', next)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useHidden(hidden: HiddenState, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(hidden, ops) }, [])

  const hideRow = (row: number) => {
    if (hidden.rows.includes(row)) return
    ops.replace('/hidden', { ...hidden, rows: [...hidden.rows, row] })
  }
  const hideCol = (col: string) => {
    if (hidden.cols.includes(col)) return
    ops.replace('/hidden', { ...hidden, cols: [...hidden.cols, col] })
  }
  const showAll = () => ops.replace('/hidden', { rows: [], cols: [] })

  return {
    hidden,
    rowSet: new Set(hidden.rows),
    colSet: new Set(hidden.cols),
    hideRow, hideCol, showAll,
    hasHidden: hidden.rows.length + hidden.cols.length > 0,
  }
}
