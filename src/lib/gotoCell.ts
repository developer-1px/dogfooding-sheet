import { COL_LETTERS } from './a1'

const ROW_LIMIT = 20

/** Resolve a cell address (e.g. "B5") to a focus id. Returns null on bad input. */
export function resolveCellRef(raw: string): string | null {
  const m = /^([A-J])(\d+)$/i.exec(raw.trim().toUpperCase())
  if (!m) return null
  const col = m[1].toUpperCase()
  if (!COL_LETTERS.includes(col as (typeof COL_LETTERS)[number])) return null
  const row = Number(m[2]) - 1
  if (row < 0 || row >= ROW_LIMIT) return null
  return `r${row}-${col}`
}

/** Prompt for a cell address and call setFocusId. */
export function gotoCell(setFocusId: (id: string) => void): void {
  let raw: string | null = null
  try { raw = window.prompt('이동할 셀 (예: B5)') } catch { return }
  const id = raw ? resolveCellRef(raw) : null
  if (id) setFocusId(id)
}
