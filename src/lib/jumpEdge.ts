import { COL_LETTERS, cellKey, parseCellId, colIndex } from './a1'

export function jumpToEdge(
  focusId: string,
  cells: Cells,
  rowCount: number,
  arrow: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const dRow = arrow === 'ArrowDown' ? 1 : arrow === 'ArrowUp' ? -1 : 0
  const dCol = arrow === 'ArrowRight' ? 1 : arrow === 'ArrowLeft' ? -1 : 0
  let r = p.row, c = colIndex(p.col)
  while (true) {
    const nr = r + dRow, nc = c + dCol
    if (nr < 0 || nr >= rowCount || nc < 0 || nc >= COL_LETTERS.length) break
    if ((cells[cellKey(COL_LETTERS[nc], nr)] ?? '') === '') break
    r = nr; c = nc
  }
  return `r${r}-${COL_LETTERS[c]}`
}

/** Tab / Shift-Tab target — one column right / left within bounds. Returns null at edge. */
export function tabTarget(focusId: string, shift: boolean): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const ci = colIndex(p.col), nci = ci + (shift ? -1 : 1)
  return nci < 0 || nci >= COL_LETTERS.length ? null : `r${p.row}-${COL_LETTERS[nci]}`
}

/** Home / End / Ctrl+Home / Ctrl+End target cell id. */
export function homeEndTarget(focusId: string, rowCount: number, key: 'Home' | 'End', ctrl: boolean): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const lastIdx = COL_LETTERS.length - 1
  const targetRow = ctrl ? (key === 'Home' ? 0 : rowCount - 1) : p.row
  const targetCol = key === 'Home' ? COL_LETTERS[0] : COL_LETTERS[lastIdx]
  return `r${targetRow}-${targetCol}`
}

/** Cell ids covering the rectangular area between two cells (inclusive). */
export function idsBetween(a: string, b: string): string[] {
  const A = parseCellId(a), B = parseCellId(b)
  if (!A || !B) return []
  const r1 = Math.min(A.row, B.row), r2 = Math.max(A.row, B.row)
  const c1 = Math.min(colIndex(A.col), colIndex(B.col))
  const c2 = Math.max(colIndex(A.col), colIndex(B.col))
  const ids: string[] = []
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ids.push(`r${r}-${COL_LETTERS[c]}`)
  return ids
}
