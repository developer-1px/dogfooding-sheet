import type { SheetOps, Cells, Writes } from './schema'
import { applyPatch, upsertKey, type Patch } from '../lib/dictOps'
import { normalizeCellWrite } from './cellValue'

export function writeSingleCell(ops: SheetOps, cells: Cells, key: string, value: string): void {
  const normalized = normalizeCellWrite(value)
  if (normalized.type === 'reject') return
  upsertKey(ops, '/cells', cells, key, normalized.type === 'remove' ? undefined : normalized.value)
}

/** Batch multiple cell writes into a single ops.patch — atomic undo for fillDown/Right etc. */
export function writeCellsBatch(ops: SheetOps, cells: Cells, writes: Writes): void {
  const patch: Patch = []
  for (const [k, v] of writes) {
    const normalized = normalizeCellWrite(v)
    if (normalized.type === 'reject') continue
    const path = `/cells/${k}`; const cur = cells[k]
    if (normalized.type === 'remove' && cur !== undefined) patch.push({ op: 'remove', path })
    else if (normalized.type === 'set' && cur === undefined) patch.push({ op: 'add', path, value: normalized.value })
    else if (normalized.type === 'set' && cur !== normalized.value) patch.push({ op: 'replace', path, value: normalized.value })
  }
  applyPatch(ops, patch)
}
