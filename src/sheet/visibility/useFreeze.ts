import { useEffect } from 'react'
import type { SheetOps } from '../schema'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export interface FreezeState { rows: number; cols: number }

export interface FreezeActions {
  toggleFreezeRows: () => void
  toggleFreezeCols: () => void
  setFreezeRows: (n: number) => void
  setFreezeCols: (n: number) => void
}

const LEGACY_KEY = 'spreadsheet:freeze:v1'

const migrateLegacy = (freeze: FreezeState, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, !freeze.rows && !freeze.cols, ops,
    (raw) => {
      const o = raw as { rows?: unknown; cols?: unknown } | null
      const next: FreezeState = { rows: typeof o?.rows === 'number' ? o.rows : 0, cols: typeof o?.cols === 'number' ? o.cols : 0 }
      return next.rows || next.cols ? next : undefined
    },
    (o, v) => o.replace('/freeze', v),
  )

export function useFreeze(freeze: FreezeState, ops: SheetOps) {
  useEffect(() => { migrateLegacy(freeze, ops) }, [freeze, ops])

  const toggleRows = () => ops.replace('/freeze', { ...freeze, rows: freeze.rows ? 0 : 1 })
  const toggleCols = () => ops.replace('/freeze', { ...freeze, cols: freeze.cols ? 0 : 1 })
  const setFreezeRows = (n: number) => ops.replace('/freeze', { ...freeze, rows: Math.max(0, n) })
  const setFreezeCols = (n: number) => ops.replace('/freeze', { ...freeze, cols: Math.max(0, n) })

  return { freeze, toggleRows, toggleCols, setFreezeRows, setFreezeCols }
}
