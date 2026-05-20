import type { SheetOps, Cells, Writes } from './schema'
import { applyPatch, type Patch } from '../lib/dictOps'

/** Batch multiple cell writes into a single ops.patch — atomic undo for fillDown/Right etc. */
export function writeCellsBatch(ops: SheetOps, cells: Cells, writes: Writes): void {
  const patch: Patch = []
  for (const [k, v] of writes) {
    const path = `/cells/${k}`; const cur = cells[k]
    if (v === '' && cur !== undefined) patch.push({ op: 'remove', path })
    else if (v !== '' && cur === undefined) patch.push({ op: 'add', path, value: v })
    else if (v !== '' && cur !== v) patch.push({ op: 'replace', path, value: v })
  }
  applyPatch(ops, patch)
}
