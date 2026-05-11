import { useEffect } from 'react'
import type { Sheet, SheetOps } from './schema'
import { migrateLegacyKey } from '../lib/legacyMigrate'
import type { Patch } from '../lib/dictOps'

export interface HiddenState {
  rows: number[]
  cols: string[]
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

export function useHidden(hidden: HiddenState, ops: SheetOps) {
  useEffect(() => { migrateLegacy(hidden, ops) }, [])

  const hideRow = (row: number) => {
    if (hidden.rows.includes(row)) return
    ops.add('/hidden/rows/-' as never, row as never)
  }
  const hideCol = (col: string) => {
    if (hidden.cols.includes(col)) return
    ops.add('/hidden/cols/-' as never, col as never)
  }
  const showAll = () => {
    const patch: Patch = []
    if (hidden.rows.length) patch.push({ op: 'replace', path: '/hidden/rows', value: [] })
    if (hidden.cols.length) patch.push({ op: 'replace', path: '/hidden/cols', value: [] })
    if (patch.length) ops.patch(patch as never)
  }

  return {
    hidden,
    rowSet: new Set(hidden.rows),
    colSet: new Set(hidden.cols),
    hideRow, hideCol, showAll,
    hasHidden: hidden.rows.length + hidden.cols.length > 0,
  }
}
