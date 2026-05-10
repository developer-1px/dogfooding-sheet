import { COL_LETTERS, ROW_COUNT, type Sheet } from './schema'

const compareValues = (a: string, b: string, dir: 1 | -1): number => {
  const na = Number(a), nb = Number(b)
  const aNum = a !== '' && Number.isFinite(na)
  const bNum = b !== '' && Number.isFinite(nb)
  // Empty strings sort to the end regardless of direction
  if (a === '' && b === '') return 0
  if (a === '') return 1
  if (b === '') return -1
  if (aNum && bNum) return (na - nb) * dir
  return a.localeCompare(b) * dir
}

interface SortOpts {
  col: string
  dir: 'asc' | 'desc'
  fromRow?: number
  toRow?: number
}

/**
 * Sort rows by values in `col`. Header row (row 0) is preserved by default.
 * Range covers rows [fromRow, toRow] inclusive (0-indexed).
 */
export function sortByColumn(
  cells: Sheet['cells'],
  { col, dir, fromRow = 1, toRow = ROW_COUNT - 1 }: SortOpts,
): Sheet['cells'] {
  const sign = dir === 'asc' ? 1 : -1
  const rows: Array<Record<string, string>> = []
  for (let r = fromRow; r <= toRow; r++) {
    const rec: Record<string, string> = {}
    for (const c of COL_LETTERS) rec[c] = cells[`${c}${r + 1}`] ?? ''
    rows.push(rec)
  }
  rows.sort((a, b) => compareValues(a[col] ?? '', b[col] ?? '', sign))

  const next: Sheet['cells'] = {}
  // Carry over cells outside the sort range untouched
  for (const [k, v] of Object.entries(cells)) {
    const m = /^[A-J](\d+)$/.exec(k)
    if (!m) continue
    const r = Number(m[1]) - 1
    if (r < fromRow || r > toRow) next[k] = v
  }
  // Write sorted rows
  for (let i = 0; i < rows.length; i++) {
    const targetRow = fromRow + i
    for (const c of COL_LETTERS) {
      const v = rows[i][c]
      if (v !== '') next[`${c}${targetRow + 1}`] = v
    }
  }
  return next
}
