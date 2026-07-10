import { COL_LETTERS as COLS } from '@spredsheet/grid'

export const DEFAULT_ROW_COUNT = 20
export const DEFAULT_COL_COUNT = 10
export const MAX_ROW_COUNT = 1000
export const MAX_COL_COUNT = COLS.length
export const MAX_SHEET_TABS = 50
export const MAX_SHEET_NAME_LENGTH = 64
export const ROW_COUNT = DEFAULT_ROW_COUNT

export const colLettersFor = (colCount: number): string[] =>
  COLS.slice(0, Math.max(1, Math.min(MAX_COL_COUNT, colCount)))
