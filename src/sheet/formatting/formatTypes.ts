export const FORMAT_KEYS = ['plain', 'currency', 'eur', 'krw', 'percent', 'integer', 'thousand', 'scientific', 'date', 'time'] as const
export type Format = typeof FORMAT_KEYS[number]
