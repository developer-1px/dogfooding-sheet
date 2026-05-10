/**
 * Parse a possibly-formatted display string ("$1.50", "30%", "1,234") into a number.
 * Returns NaN if not a valid number after stripping common format symbols.
 */
export const numericValue = (s: string): number => Number(s.replace(/[$€₩,%\s]/g, ''))

export const isNumeric = (s: string): boolean => {
  if (s === '') return false
  return Number.isFinite(numericValue(s))
}
