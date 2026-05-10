import { COL_LETTERS } from './a1'

const ROW_LIMIT = 20

/** Prompt for a cell address (e.g. B5) and call setFocusId with r{row}-{col}. */
export function gotoCell(setFocusId: (id: string) => void): void {
  let raw: string | null = null
  try { raw = window.prompt('이동할 셀 (예: B5)') } catch { return }
  if (!raw) return
  const m = /^([A-J])(\d+)$/i.exec(raw.trim().toUpperCase())
  if (!m) return
  const col = m[1].toUpperCase()
  if (!COL_LETTERS.includes(col as (typeof COL_LETTERS)[number])) return
  const row = Number(m[2]) - 1
  if (row < 0 || row >= ROW_LIMIT) return
  setFocusId(`r${row}-${col}`)
}
