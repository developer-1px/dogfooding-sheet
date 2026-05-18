import { COL_LETTERS, cellKey, cellId, parseCellId, colIndex, type Cells } from '@spredsheet/grid'
import { idsInRect, rectFromRefs } from '@spredsheet/grid'

export function jumpToEdge(
  focusId: string,
  cells: Cells,
  rowCount: number,
  arrow: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  colLetters: readonly string[] = COL_LETTERS,
): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const dRow = arrow === 'ArrowDown' ? 1 : arrow === 'ArrowUp' ? -1 : 0
  const dCol = arrow === 'ArrowRight' ? 1 : arrow === 'ArrowLeft' ? -1 : 0
  let r = p.row, c = colIndex(p.col)
  while (true) {
    const nr = r + dRow, nc = c + dCol
    if (nr < 0 || nr >= rowCount || nc < 0 || nc >= colLetters.length) break
    if ((cells[cellKey(colLetters[nc], nr)] ?? '') === '') break
    r = nr; c = nc
  }
  return cellId(colLetters[c], r)
}

/** Tab / Shift-Tab target — one column right / left within bounds. Returns null at edge. */
export function tabTarget(focusId: string, shift: boolean, colLetters: readonly string[] = COL_LETTERS): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const ci = colIndex(p.col), nci = ci + (shift ? -1 : 1)
  return nci < 0 || nci >= colLetters.length ? null : cellId(colLetters[nci], p.row)
}

/** Home / End / Ctrl+Home / Ctrl+End target cell id. */
export function homeEndTarget(focusId: string, rowCount: number, key: 'Home' | 'End', ctrl: boolean, colLetters: readonly string[] = COL_LETTERS): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const lastIdx = colLetters.length - 1
  const targetRow = ctrl ? (key === 'Home' ? 0 : rowCount - 1) : p.row
  const targetCol = key === 'Home' ? colLetters[0] : colLetters[lastIdx]
  return cellId(targetCol, targetRow)
}

/** Cell ids covering the rectangular area between two cells (inclusive). */
export function idsBetween(a: string, b: string): string[] {
  const A = parseCellId(a), B = parseCellId(b)
  return A && B ? idsInRect(rectFromRefs(A, B)) : []
}
