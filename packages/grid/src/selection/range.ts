import { COL_LETTERS, cellId } from '../coordinates/a1'

export const appendIdsForCol = (out: string[], col: string, rowCount: number): void => {
  for (let row = 0; row < rowCount; row++) out.push(cellId(col, row))
}

export const appendIdsForRow = (out: string[], row: number, colLetters: readonly string[] = COL_LETTERS): void => {
  for (const col of colLetters) out.push(cellId(col, row))
}

export const idsForCol = (col: string, rowCount: number): string[] => {
  const out: string[] = []
  appendIdsForCol(out, col, rowCount)
  return out
}

export const idsForRow = (row: number, colLetters: readonly string[] = COL_LETTERS): string[] => {
  const out: string[] = []
  appendIdsForRow(out, row, colLetters)
  return out
}

export const idsForAll = (rowCount: number, colLetters: readonly string[] = COL_LETTERS): string[] => {
  const out: string[] = []
  for (let r = 0; r < rowCount; r++) {
    for (const c of colLetters) out.push(cellId(c, r))
  }
  return out
}
