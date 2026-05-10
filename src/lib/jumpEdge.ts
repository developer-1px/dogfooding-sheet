import { COL_LETTERS, cellKey, parseCellId } from './a1'

export function jumpToEdge(
  focusId: string,
  cells: Record<string, string>,
  rowCount: number,
  arrow: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
): string | null {
  const p = parseCellId(focusId); if (!p) return null
  const dRow = arrow === 'ArrowDown' ? 1 : arrow === 'ArrowUp' ? -1 : 0
  const dCol = arrow === 'ArrowRight' ? 1 : arrow === 'ArrowLeft' ? -1 : 0
  let r = p.row, c = COL_LETTERS.indexOf(p.col)
  while (true) {
    const nr = r + dRow, nc = c + dCol
    if (nr < 0 || nr >= rowCount || nc < 0 || nc >= COL_LETTERS.length) break
    if ((cells[cellKey(COL_LETTERS[nc], nr)] ?? '') === '') break
    r = nr; c = nc
  }
  return `r${r}-${COL_LETTERS[c]}`
}

/** Cell ids covering the rectangular area between two cells (inclusive). */
export function idsBetween(a: string, b: string): string[] {
  const A = parseCellId(a), B = parseCellId(b)
  if (!A || !B) return []
  const r1 = Math.min(A.row, B.row), r2 = Math.max(A.row, B.row)
  const c1 = Math.min(COL_LETTERS.indexOf(A.col), COL_LETTERS.indexOf(B.col))
  const c2 = Math.max(COL_LETTERS.indexOf(A.col), COL_LETTERS.indexOf(B.col))
  const ids: string[] = []
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ids.push(`r${r}-${COL_LETTERS[c]}`)
  return ids
}
