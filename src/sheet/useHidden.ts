import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spreadsheet:hidden:v1'

export interface HiddenState {
  rows: number[]
  cols: string[]
}

const load = (): HiddenState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { rows: [], cols: [] }
    const obj = JSON.parse(raw)
    return {
      rows: Array.isArray(obj?.rows) ? obj.rows.filter((n: unknown) => typeof n === 'number') : [],
      cols: Array.isArray(obj?.cols) ? obj.cols.filter((s: unknown) => typeof s === 'string') : [],
    }
  } catch { return { rows: [], cols: [] } }
}

export function useHidden() {
  const [hidden, setHidden] = useState<HiddenState>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden)) } catch { /* quota */ }
  }, [hidden])

  const hideRow = (row: number) => setHidden((h) => h.rows.includes(row) ? h : { ...h, rows: [...h.rows, row] })
  const hideCol = (col: string) => setHidden((h) => h.cols.includes(col) ? h : { ...h, cols: [...h.cols, col] })
  const showAll = () => setHidden({ rows: [], cols: [] })

  return {
    hidden,
    rowSet: new Set(hidden.rows),
    colSet: new Set(hidden.cols),
    hideRow, hideCol, showAll,
    hasHidden: hidden.rows.length + hidden.cols.length > 0,
  }
}
