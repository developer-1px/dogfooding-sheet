import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spreadsheet:freeze:v1'

export interface FreezeState { rows: 0 | 1; cols: 0 | 1 }

const load = (): FreezeState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { rows: 0, cols: 0 }
    const obj = JSON.parse(raw)
    return {
      rows: obj?.rows === 1 ? 1 : 0,
      cols: obj?.cols === 1 ? 1 : 0,
    }
  } catch { return { rows: 0, cols: 0 } }
}

export function useFreeze() {
  const [freeze, setFreeze] = useState<FreezeState>(load)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(freeze)) } catch { /* quota */ }
  }, [freeze])

  const toggleRows = () => setFreeze((f) => ({ ...f, rows: f.rows ? 0 : 1 }))
  const toggleCols = () => setFreeze((f) => ({ ...f, cols: f.cols ? 0 : 1 }))

  return { freeze, toggleRows, toggleCols }
}
