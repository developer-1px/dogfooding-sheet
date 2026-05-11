import { SheetSchema, initialSheet, COL_LETTERS, ROW_COUNT, cellKey, cellId, parseCellId, colIndex, type Sheet } from './schema'
import { fromTree, type NormalizedData } from '@p/aria-kernel'

const STORAGE_KEY = 'spreadsheet:v1'

export const loadInitial = (): Sheet => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialSheet
    const parsed = SheetSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : initialSheet
  } catch { return initialSheet }
}

export const saveSheet = (sheet: Sheet) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet)) } catch { /* quota */ }
}

export const moveCellId = (id: string, dRow: number, dCol: number): string | null => {
  const p = parseCellId(id)
  if (!p) return null
  const colIdx = colIndex(p.col)
  const nCol = colIdx + dCol
  const nRow = p.row + dRow
  if (nCol < 0 || nCol >= COL_LETTERS.length || nRow < 0 || nRow >= ROW_COUNT) return id
  return cellId(COL_LETTERS[nCol], nRow)
}

interface Node { id: string; label: string; children?: Node[] }

export function buildData(getCell: (k: string, col: string, row: number) => string): NormalizedData {
  const tree: Node[] = [
    ...COL_LETTERS.map((c): Node => ({ id: `h-${c}`, label: c })),
    ...Array.from({ length: ROW_COUNT }, (_, r): Node => ({
      id: `r${r}`,
      label: String(r + 1),
      children: COL_LETTERS.map((c) => ({
        id: cellId(c, r),
        label: getCell(cellKey(c, r), c, r),
      })),
    })),
  ]
  return fromTree(tree)
}
