import { SheetSchema, initialSheet, colLettersFor, ROW_COUNT, cellKey, cellId, parseCellId, type Sheet } from './schema'
import { fromTree, type NormalizedData } from '@interactive-os/aria-kernel'
import { moveGrid } from '@interactive-os/keyboard-navigation'

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

export const moveCellId = (id: string, dRow: number, dCol: number, rowCount = ROW_COUNT, colLetters: readonly string[] = colLettersFor(10)): string | null => {
  const p = parseCellId(id)
  if (!p) return null
  const rows = Array.from(
    { length: rowCount },
    (_, row) => colLetters.map((col) => cellId(col, row)),
  )
  const action =
    dRow > 0 ? 'down'
      : dRow < 0 ? 'up'
        : dCol > 0 ? 'right'
          : dCol < 0 ? 'left'
            : null
  return action ? moveGrid(rows, id, action) ?? id : id
}

interface Node { id: string; label: string; children?: Node[] }

export function buildData(getCell: (k: string, col: string, row: number) => string, rowCount = ROW_COUNT, colLetters = colLettersFor(10)): NormalizedData {
  const tree: Node[] = [
    ...colLetters.map((c): Node => ({ id: `h-${c}`, label: c })),
    ...Array.from({ length: rowCount }, (_, r): Node => ({
      id: `r${r}`,
      label: String(r + 1),
      children: colLetters.map((c) => ({
        id: cellId(c, r),
        label: getCell(cellKey(c, r), c, r),
      })),
    })),
  ]
  return fromTree(tree)
}
