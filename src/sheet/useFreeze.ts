import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

export interface FreezeState { rows: 0 | 1; cols: 0 | 1 }

const LEGACY_KEY = 'spreadsheet:freeze:v1'

function migrateLegacy(freeze: FreezeState, ops: JsonOps<Sheet>) {
  if (freeze.rows || freeze.cols) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    const next: FreezeState = { rows: obj?.rows === 1 ? 1 : 0, cols: obj?.cols === 1 ? 1 : 0 }
    if (next.rows || next.cols) ops.replace('/freeze', next)
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useFreeze(freeze: FreezeState, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(freeze, ops) }, [])

  const toggleRows = () => ops.replace('/freeze', { ...freeze, rows: freeze.rows ? 0 : 1 } as FreezeState)
  const toggleCols = () => ops.replace('/freeze', { ...freeze, cols: freeze.cols ? 0 : 1 } as FreezeState)

  return { freeze, toggleRows, toggleCols }
}
