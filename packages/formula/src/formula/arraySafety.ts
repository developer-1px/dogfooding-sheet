import { MAX_EXPANDED_REFS } from './parse'
import { MAX_GENERATED_TEXT_LENGTH } from './textLimit'

export const MAX_FORMULA_ARRAY_CELLS = MAX_EXPANDED_REFS

export const isSafeArrayShape = (rows: number, cols: number): boolean => {
  const cells = rows * cols
  return (
    Number.isSafeInteger(rows) && Number.isSafeInteger(cols) &&
    rows >= 0 && cols >= 0 &&
    Number.isSafeInteger(cells) && cells <= MAX_FORMULA_ARRAY_CELLS
  )
}

const arrayCellCount = (value: readonly unknown[]): number => {
  let total = 0
  for (const item of value) total += Array.isArray(item) ? item.length : 1
  return total
}

export const stringifyFormulaArray = (value: readonly unknown[]): string => {
  if (arrayCellCount(value) > MAX_FORMULA_ARRAY_CELLS) return '#VALUE!'
  const json = JSON.stringify(value)
  return json.length <= MAX_GENERATED_TEXT_LENGTH ? json : '#VALUE!'
}
