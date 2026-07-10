export const FORMAT_KEYS = ['plain', 'currency', 'eur', 'krw', 'percent', 'integer', 'thousand', 'scientific', 'date', 'time'] as const
export type Format = typeof FORMAT_KEYS[number]

export const isFormat = (value: unknown): value is Format =>
  typeof value === 'string' && (FORMAT_KEYS as readonly string[]).includes(value)

export const normalizeStoredFormat = (value: unknown): Format | undefined => {
  if (!isFormat(value)) return undefined
  return value === 'plain' ? undefined : value
}
