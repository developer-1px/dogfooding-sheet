import { fillDownWrites, fillRightWrites, type Cells, type Writes, type WriteCell, type WriteMany } from '@spredsheet/grid'

const flush = (writes: Writes, write: WriteCell, writeMany?: WriteMany) => {
  if (writes.length === 0) return
  if (writeMany) writeMany(writes); else for (const [k, v] of writes) write(k, v)
}

/** Copy top-most selected cell per column down into rest of selection (Cmd+D). */
export function fillDown(selectedIds: string[], cells: Cells, write: WriteCell, writeMany?: WriteMany): void {
  flush(fillDownWrites(selectedIds, cells), write, writeMany)
}

/** Mirror of fillDown: copy left-most cell per row rightward within selection. */
export function fillRight(selectedIds: string[], cells: Cells, write: WriteCell, writeMany?: WriteMany): void {
  flush(fillRightWrites(selectedIds, cells), write, writeMany)
}
