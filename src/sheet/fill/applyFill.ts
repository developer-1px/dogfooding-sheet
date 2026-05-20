import { applyFillWrites, type Cells, type Rect, type Writes, type WriteCell, type WriteMany } from '@spredsheet/grid'

export function applyFill(
  src: Rect,
  tgt: Rect,
  cells: Cells,
  write: WriteCell,
  writeMany?: WriteMany,
): boolean {
  const writes: Writes = applyFillWrites(src, tgt, cells)
  try {
    if (writes.length === 0) return true
    if (writeMany) writeMany(writes); else for (const [k, v] of writes) write(k, v)
    return true
  } catch {
    return false
  }
}
