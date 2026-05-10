import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { migrateLegacyKey } from './lib/legacyMigrate'

export interface FreezeState { rows: 0 | 1; cols: 0 | 1 }

const LEGACY_KEY = 'spreadsheet:freeze:v1'

const migrateLegacy = (freeze: FreezeState, ops: JsonOps<Sheet>) =>
  migrateLegacyKey(LEGACY_KEY, !freeze.rows && !freeze.cols, ops,
    (raw) => {
      const o = raw as { rows?: unknown; cols?: unknown } | null
      const next: FreezeState = { rows: o?.rows === 1 ? 1 : 0, cols: o?.cols === 1 ? 1 : 0 }
      return next.rows || next.cols ? next : undefined
    },
    (o, v) => o.replace('/freeze', v),
  )

export function useFreeze(freeze: FreezeState, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(freeze, ops) }, [])

  const toggleRows = () => ops.replace('/freeze', { ...freeze, rows: freeze.rows ? 0 : 1 } as FreezeState)
  const toggleCols = () => ops.replace('/freeze', { ...freeze, cols: freeze.cols ? 0 : 1 } as FreezeState)

  return { freeze, toggleRows, toggleCols }
}
