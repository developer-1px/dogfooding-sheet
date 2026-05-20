export const MAX_CELL_TEXT_LENGTH = 10_000

export type NormalizedCellWrite =
  | { type: 'remove' }
  | { type: 'set', value: string }
  | { type: 'reject' }

export const isSafeCellText = (value: string): boolean =>
  value.length <= MAX_CELL_TEXT_LENGTH

export const normalizeCellWrite = (value: string): NormalizedCellWrite => {
  if (value === '') return { type: 'remove' }
  return isSafeCellText(value) ? { type: 'set', value } : { type: 'reject' }
}

export const sanitizeCellRecord = (cells: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(cells).filter(([, value]) => value !== '' && isSafeCellText(value)))
