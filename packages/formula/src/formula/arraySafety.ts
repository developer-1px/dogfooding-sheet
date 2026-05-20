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

const jsonElementLength = (value: unknown, limit: number): number | null => {
  if (!Array.isArray(value)) {
    const json = JSON.stringify(value) ?? 'null'
    return json.length <= limit ? json.length : null
  }

  let length = 2
  for (let i = 0; i < value.length; i++) {
    if (i > 0) length++
    const childLength = jsonElementLength(value[i], limit - length)
    if (childLength === null) return null
    length += childLength
    if (length > limit) return null
  }
  return length
}

export const stringifyFormulaArray = (value: readonly unknown[]): string => {
  if (arrayCellCount(value) > MAX_FORMULA_ARRAY_CELLS) return '#VALUE!'
  if (jsonElementLength(value, MAX_GENERATED_TEXT_LENGTH) === null) return '#VALUE!'
  return JSON.stringify(value) ?? '#VALUE!'
}
