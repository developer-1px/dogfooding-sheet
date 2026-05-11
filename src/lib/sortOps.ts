import { COL_LETTERS, cellKey, type Cells } from './a1'


const compareValues = (a: string, b: string, dir: 1 | -1): number => {
  const na = Number(a), nb = Number(b)
  const aNum = a !== '' && Number.isFinite(na)
  const bNum = b !== '' && Number.isFinite(nb)
  if (a === '' && b === '') return 0
  if (a === '') return 1
  if (b === '') return -1
  if (aNum && bNum) return (na - nb) * dir
  return a.localeCompare(b) * dir
}

export interface SortOpts {
  col: string
  dir: 'asc' | 'desc'
  /** Required upper bound (exclusive) so the lib stays decoupled from the sheet's row count. */
  rowCount: number
  fromRow?: number
  toRow?: number
}

/**
 * Sort rows by values in `col`. Header row (row 0) is preserved by default.
 * Range covers rows [fromRow, toRow] inclusive (0-indexed).
 */
export function sortByColumn(cells: Cells, opts: SortOpts): Cells {
  const { col, dir, rowCount, fromRow = 1, toRow = rowCount - 1 } = opts
  const sign = dir === 'asc' ? 1 : -1
  const rows: Array<Record<string, string>> = []
  for (let r = fromRow; r <= toRow; r++) {
    const rec: Record<string, string> = {}
    for (const c of COL_LETTERS) rec[c] = cells[cellKey(c, r)] ?? ''
    rows.push(rec)
  }
  rows.sort((a, b) => compareValues(a[col] ?? '', b[col] ?? '', sign))

  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const m = /^[A-J](\d+)$/.exec(k)
    if (!m) continue
    const r = Number(m[1]) - 1
    if (r < fromRow || r > toRow) next[k] = v
  }
  for (let i = 0; i < rows.length; i++) {
    const targetRow = fromRow + i
    for (const c of COL_LETTERS) {
      const v = rows[i][c]
      if (v !== '') next[cellKey(c, targetRow)] = v
    }
  }
  return next
}
