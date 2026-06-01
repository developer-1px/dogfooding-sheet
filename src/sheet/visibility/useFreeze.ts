import { useEffect, useMemo } from 'react'
import { MAX_COL_COUNT, MAX_ROW_COUNT, normalizeFreeze, type SheetOps } from '../schema'
import { migrateLegacyKey } from '../../lib/legacyMigrate'

export interface FreezeState { rows: number; cols: number }

export interface FreezeActions {
  toggleFreezeRows: () => void
  toggleFreezeCols: () => void
  setFreezeRows: (n: number) => void
  setFreezeCols: (n: number) => void
}

export interface FreezeMutationCommands {
  toggleRows: () => boolean
  toggleCols: () => boolean
  setRows: (rows: number) => boolean
  setCols: (cols: number) => boolean
}

const LEGACY_KEY = 'spreadsheet:freeze:v1'

interface FreezeBounds {
  rowCount: number
  colCount: number
}

const defaultFreezeBounds = (bounds?: FreezeBounds): FreezeBounds => ({
  rowCount: bounds?.rowCount ?? MAX_ROW_COUNT,
  colCount: bounds?.colCount ?? MAX_COL_COUNT,
})

export const coerceLegacyFreeze = (raw: unknown, bounds?: FreezeBounds): FreezeState | undefined => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const next = normalizeFreeze(raw, defaultFreezeBounds(bounds))
  return next.rows || next.cols ? next : undefined
}

const migrateLegacy = (freeze: FreezeState, ops: SheetOps, bounds?: FreezeBounds) =>
  migrateLegacyKey(LEGACY_KEY, !freeze.rows && !freeze.cols, ops,
    (raw) => coerceLegacyFreeze(raw, bounds),
    (o, v) => o.replace('/freeze', v),
  )

const sameFreeze = (a: FreezeState, b: FreezeState): boolean =>
  a.rows === b.rows && a.cols === b.cols

export const setFreezeState = (
  ops: SheetOps,
  freeze: FreezeState,
  next: FreezeState,
  bounds?: FreezeBounds,
  command?: (nextFreeze: FreezeState) => boolean,
): boolean => {
  const nextFreeze = normalizeFreeze(next, defaultFreezeBounds(bounds))
  if (sameFreeze(normalizeFreeze(freeze, defaultFreezeBounds(bounds)), nextFreeze)) return false
  if (command?.(nextFreeze)) return true
  ops.replace('/freeze', nextFreeze)
  return true
}

export function useFreeze(freeze: FreezeState, ops: SheetOps, bounds?: FreezeBounds, commands?: FreezeMutationCommands) {
  const rowCount = bounds?.rowCount ?? MAX_ROW_COUNT
  const colCount = bounds?.colCount ?? MAX_COL_COUNT
  const current = useMemo(() => normalizeFreeze(freeze, { rowCount, colCount }), [freeze, rowCount, colCount])

  useEffect(() => { migrateLegacy(current, ops, { rowCount, colCount }) }, [current, ops, rowCount, colCount])

  const replaceFreeze = (next: FreezeState, command?: (nextFreeze: FreezeState) => boolean) =>
    setFreezeState(ops, current, next, { rowCount, colCount }, command)
  const toggleRows = () => {
    if (commands?.toggleRows()) return
    replaceFreeze({ ...current, rows: current.rows ? 0 : 1 })
  }
  const toggleCols = () => {
    if (commands?.toggleCols()) return
    replaceFreeze({ ...current, cols: current.cols ? 0 : 1 })
  }
  const setFreezeRows = (n: number) => replaceFreeze({ ...current, rows: n }, (next) => commands?.setRows(next.rows) ?? false)
  const setFreezeCols = (n: number) => replaceFreeze({ ...current, cols: n }, (next) => commands?.setCols(next.cols) ?? false)

  return { freeze: current, toggleRows, toggleCols, setFreezeRows, setFreezeCols }
}
