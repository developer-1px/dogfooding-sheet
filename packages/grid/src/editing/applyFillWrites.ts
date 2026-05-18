import { cellKey, columnLabel, type Cells, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'
import { extendSeries } from './series'

export function applyFillWrites(src: Rect, tgt: Rect, cells: Cells): Writes {
  const writes: Writes = []
  const fillingDown = tgt.rMax > src.rMax
  if (fillingDown) {
    for (let c = src.cMin; c <= src.cMax; c++) {
      const source: string[] = []
      for (let r = src.rMin; r <= src.rMax; r++) source.push(cells[cellKey(columnLabel(c), r)] ?? '')
      const ext = extendSeries(source, tgt.rMax - src.rMin + 1)
      for (let i = source.length; i < ext.length; i++) writes.push([cellKey(columnLabel(c), src.rMin + i), ext[i]])
    }
  } else {
    for (let r = src.rMin; r <= src.rMax; r++) {
      const source: string[] = []
      for (let c = src.cMin; c <= src.cMax; c++) source.push(cells[cellKey(columnLabel(c), r)] ?? '')
      const ext = extendSeries(source, tgt.cMax - src.cMin + 1)
      for (let i = source.length; i < ext.length; i++) writes.push([cellKey(columnLabel(src.cMin + i), r), ext[i]])
    }
  }
  return writes
}
