import { COL_LETTERS } from './a1'

/**
 * Cell ID generators for selection/highlighting.
 * IDs follow the `r{row}-{col}` convention (0-based row).
 */

export const idsForCol = (col: string, rowCount: number): string[] =>
  Array.from({ length: rowCount }, (_, r) => `r${r}-${col}`)

export const idsForRow = (row: number): string[] =>
  COL_LETTERS.map((c) => `r${row}-${c}`)

export const idsForAll = (rowCount: number): string[] => {
  const out: string[] = []
  for (let r = 0; r < rowCount; r++) {
    for (const c of COL_LETTERS) out.push(`r${r}-${c}`)
  }
  return out
}
