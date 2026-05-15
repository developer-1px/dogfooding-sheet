import { COL_LETTERS, cellId } from './a1'

/**
 * Cell ID generators for selection/highlighting.
 * IDs follow the `r{row}-{col}` convention (0-based row).
 */

export const idsForCol = (col: string, rowCount: number): string[] =>
  Array.from({ length: rowCount }, (_, r) => cellId(col, r))

export const idsForRow = (row: number, colLetters: readonly string[] = COL_LETTERS): string[] =>
  colLetters.map((c) => cellId(c, row))

export const idsForAll = (rowCount: number, colLetters: readonly string[] = COL_LETTERS): string[] => {
  const out: string[] = []
  for (let r = 0; r < rowCount; r++) {
    for (const c of colLetters) out.push(cellId(c, r))
  }
  return out
}
