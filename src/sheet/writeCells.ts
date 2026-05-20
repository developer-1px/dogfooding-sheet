import { colIndex, parseA1, type SheetOps, type Cells, type Writes } from './schema'
import { applyPatch, upsertKey, type Patch } from '../lib/dictOps'
import { normalizeCellWrite } from './cellValue'

interface CellWriteBounds {
  rowCount: number
  colCount: number
}

const validCellKey = (key: string, bounds?: CellWriteBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

export function writeSingleCell(ops: SheetOps, cells: Cells, key: string, value: string, bounds?: CellWriteBounds): void {
  if (!validCellKey(key, bounds)) return
  const normalized = normalizeCellWrite(value)
  if (normalized.type === 'reject') return
  upsertKey(ops, '/cells', cells, key, normalized.type === 'remove' ? undefined : normalized.value)
}

/** Batch multiple cell writes into a single ops.patch — atomic undo for fillDown/Right etc. */
export function writeCellsBatch(ops: SheetOps, cells: Cells, writes: Writes, bounds?: CellWriteBounds): void {
  const patch: Patch = []
  for (const [k, v] of writes) {
    if (!validCellKey(k, bounds)) continue
    const normalized = normalizeCellWrite(v)
    if (normalized.type === 'reject') continue
    const path = `/cells/${k}`; const cur = cells[k]
    if (normalized.type === 'remove' && cur !== undefined) patch.push({ op: 'remove', path })
    else if (normalized.type === 'set' && cur === undefined) patch.push({ op: 'add', path, value: normalized.value })
    else if (normalized.type === 'set' && cur !== normalized.value) patch.push({ op: 'replace', path, value: normalized.value })
  }
  applyPatch(ops, patch)
}
