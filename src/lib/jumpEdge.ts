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
