import { COL_LETTERS, ROW_COUNT } from './schema'

export const idsForCol = (col: string): string[] =>
  Array.from({ length: ROW_COUNT }, (_, r) => `r${r}-${col}`)

export const idsForRow = (row: number): string[] =>
  COL_LETTERS.map((c) => `r${row}-${c}`)

export const idsForAll = (): string[] => {
  const out: string[] = []
  for (let r = 0; r < ROW_COUNT; r++) {
    for (const c of COL_LETTERS) out.push(`r${r}-${c}`)
  }
  return out
}
