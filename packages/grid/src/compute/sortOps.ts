import { COL_LETTERS, cellKey, colIndex, columnLabels, parseA1, type Cells } from '../coordinates/a1'

const coerceNumber = (value: string): number => {
  const s = value.trim()
  if (s === '') return NaN
  const paren = /^\((.*)\)$/.exec(s)
  const body = paren ? paren[1].trim() : s
  const percent = body.endsWith('%')
  const stripped = body
    .replace(/^[+$€₩¥£]\s*/, '')
    .replace(/\s*[€₩¥£]$/, '')
  const raw = percent ? stripped.slice(0, -1).trim() : stripped
  const cleaned = raw.replace(/,/g, '')
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(cleaned)) return NaN
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return NaN
  const signed = paren ? -n : n
  return percent ? signed / 100 : signed
}

const compareValues = (a: string, b: string, dir: 1 | -1): number => {
  const na = coerceNumber(a)
  const nb = coerceNumber(b)
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
  rowCount: number
  colCount?: number
  fromRow?: number
  toRow?: number
}

const sortRows = (cells: Cells, opts: SortOpts): Array<{ sourceRow: number; cells: Record<string, string> }> => {
  const { col, dir, rowCount, colCount = Math.max(COL_LETTERS.length, colIndex(col) + 1), fromRow = 1, toRow = rowCount - 1 } = opts
  const cols = columnLabels(colCount)
  const sign = dir === 'asc' ? 1 : -1
  const rows: Array<{ sourceRow: number; cells: Record<string, string> }> = []
  for (let r = fromRow; r <= toRow; r++) {
    const rec: Record<string, string> = {}
    for (const c of cols) rec[c] = cells[cellKey(c, r)] ?? ''
    rows.push({ sourceRow: r, cells: rec })
  }
  rows.sort((a, b) => compareValues(a.cells[col] ?? '', b.cells[col] ?? '', sign))
  return rows
}

export function sortRowOrder(cells: Cells, opts: SortOpts): number[] {
  return sortRows(cells, opts).map((row) => row.sourceRow)
}

export function sortByColumn(cells: Cells, opts: SortOpts): Cells {
  const { col, rowCount, colCount = Math.max(COL_LETTERS.length, colIndex(col) + 1), fromRow = 1, toRow = rowCount - 1 } = opts
  const cols = columnLabels(colCount)
  const rows = sortRows(cells, opts)

  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    if (p.row < fromRow || p.row > toRow) next[k] = v
  }
  for (let i = 0; i < rows.length; i++) {
    const targetRow = fromRow + i
    for (const c of cols) {
      const v = rows[i].cells[c]
      if (v !== '') next[cellKey(c, targetRow)] = v
    }
  }
  return next
}
