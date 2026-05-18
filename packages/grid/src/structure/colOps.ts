import { COL_LETTERS, cellKey, colIndex, parseA1, type Cells } from '../coordinates/a1'
import { shiftFormulaCols } from './formulaRefs'

const idxCol = (i: number) => COL_LETTERS[i]

export function insertCol(cells: Cells, atCol: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const ci = colIndex(p.col)
    const shifted = shiftFormulaCols(v, atCol, 1)
    if (ci < atCol) next[k] = shifted
    else {
      const nc = idxCol(ci + 1)
      if (nc) next[cellKey(nc, p.row)] = shifted
    }
  }
  return next
}

export function deleteCol(cells: Cells, atCol: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const ci = colIndex(p.col)
    if (ci === atCol) continue
    let shifted = v
    if (v.startsWith('=')) {
      shifted = shiftFormulaCols(v, atCol, -1)
    }
    if (ci < atCol) next[k] = shifted
    else {
      const nc = idxCol(ci - 1)
      if (nc) next[cellKey(nc, p.row)] = shifted
    }
  }
  return next
}
