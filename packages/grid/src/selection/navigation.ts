import { COL_LETTERS, cellId, cellKey, colIndex, parseCellId, type Cells } from '../coordinates/a1'
import { idsInRect, rectFromRefs } from '../geometry/rect'

export type GridArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export function jumpToEdge(
  focusId: string,
  cells: Cells,
  rowCount: number,
  arrow: GridArrowKey,
  colLetters: readonly string[] = COL_LETTERS,
): string | null {
  const p = parseCellId(focusId)
  if (!p) return null
  const dRow = arrow === 'ArrowDown' ? 1 : arrow === 'ArrowUp' ? -1 : 0
  const dCol = arrow === 'ArrowRight' ? 1 : arrow === 'ArrowLeft' ? -1 : 0
  let r = p.row
  let c = colIndex(p.col)
  while (true) {
    const nr = r + dRow
    const nc = c + dCol
    if (nr < 0 || nr >= rowCount || nc < 0 || nc >= colLetters.length) break
    if ((cells[cellKey(colLetters[nc], nr)] ?? '') === '') break
    r = nr
    c = nc
  }
  return cellId(colLetters[c], r)
}

export function tabTarget(focusId: string, shift: boolean, colLetters: readonly string[] = COL_LETTERS): string | null {
  const p = parseCellId(focusId)
  if (!p) return null
  const ci = colIndex(p.col)
  const nci = ci + (shift ? -1 : 1)
  return nci < 0 || nci >= colLetters.length ? null : cellId(colLetters[nci], p.row)
}

export function homeEndTarget(
  focusId: string,
  rowCount: number,
  key: 'Home' | 'End',
  ctrl: boolean,
  colLetters: readonly string[] = COL_LETTERS,
): string | null {
  const p = parseCellId(focusId)
  if (!p) return null
  const lastIdx = colLetters.length - 1
  const targetRow = ctrl ? (key === 'Home' ? 0 : rowCount - 1) : p.row
  const targetCol = key === 'Home' ? colLetters[0] : colLetters[lastIdx]
  return cellId(targetCol, targetRow)
}

export function pageTarget(focusId: string, rowCount: number, key: 'PageUp' | 'PageDown', pageSize = 10): string | null {
  const p = parseCellId(focusId)
  if (!p) return null
  return cellId(p.col, Math.max(0, Math.min(rowCount - 1, p.row + (key === 'PageUp' ? -pageSize : pageSize))))
}

export function idsBetween(a: string, b: string): string[] {
  const refA = parseCellId(a)
  const refB = parseCellId(b)
  return refA && refB ? idsInRect(rectFromRefs(refA, refB)) : []
}

