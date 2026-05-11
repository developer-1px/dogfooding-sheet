import { COL_LETTERS, cellKey, type Writes, type WriteCell } from './a1'
import type { Rect } from './rect'
import { extendSeries } from './series'

export function applyFill(
  src: Rect,
  tgt: Rect,
  cells: Record<string, string>,
  write: WriteCell,
  writeMany?: (writes: Writes) => void,
) {
  const writes: Writes = []
  const fillingDown = tgt.rMax > src.rMax
  if (fillingDown) {
    for (let c = src.cMin; c <= src.cMax; c++) {
      const source: string[] = []
      for (let r = src.rMin; r <= src.rMax; r++) source.push(cells[cellKey(COL_LETTERS[c], r)] ?? '')
      const ext = extendSeries(source, tgt.rMax - src.rMin + 1)
      for (let i = source.length; i < ext.length; i++) writes.push([cellKey(COL_LETTERS[c], src.rMin + i), ext[i]])
    }
  } else {
    for (let r = src.rMin; r <= src.rMax; r++) {
      const source: string[] = []
      for (let c = src.cMin; c <= src.cMax; c++) source.push(cells[cellKey(COL_LETTERS[c], r)] ?? '')
      const ext = extendSeries(source, tgt.cMax - src.cMin + 1)
      for (let i = source.length; i < ext.length; i++) writes.push([cellKey(COL_LETTERS[src.cMin + i], r), ext[i]])
    }
  }
  if (writes.length === 0) return
  if (writeMany) writeMany(writes); else for (const [k, v] of writes) write(k, v)
}
