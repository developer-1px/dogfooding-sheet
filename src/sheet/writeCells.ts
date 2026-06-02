import { colIndex, parseA1, type SheetOps, type Cells, type Writes } from './schema'
import { upsertKey, upsertKeys, type RecordEditEntries } from '../lib/dictOps'
import { normalizeCellWrite } from './cellValue'

interface CellWriteBounds {
  rowCount: number
  colCount: number
}

export type EditCellEntries = RecordEditEntries<string>

const validCellKey = (key: string, bounds?: CellWriteBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

export function writeSingleCell(
  ops: SheetOps,
  cells: Cells,
  key: string,
  value: string,
  bounds?: CellWriteBounds,
  editEntries?: EditCellEntries,
): void {
  if (!validCellKey(key, bounds)) return
  const normalized = normalizeCellWrite(value)
  if (normalized.type === 'reject') return
  upsertKey(ops, '/cells', cells, key, normalized.type === 'remove' ? undefined : normalized.value, undefined, { editEntries })
}

/** Batch multiple cell writes into a single ops.patch — atomic undo for fillDown/Right etc. */
export function writeCellsBatch(
  ops: SheetOps,
  cells: Cells,
  writes: Writes,
  bounds?: CellWriteBounds,
  editEntries?: EditCellEntries,
): void {
  const entries: Array<[string, string | undefined]> = []
  for (const [k, v] of writes) {
    if (!validCellKey(k, bounds)) continue
    const normalized = normalizeCellWrite(v)
    if (normalized.type === 'reject') continue
    entries.push([k, normalized.type === 'remove' ? undefined : normalized.value])
  }
  const latestEntries = [...new Map(entries)]
  upsertKeys(ops, '/cells', cells, latestEntries, undefined, { editEntries })
}
