export const numericValue = (s: string): number => Number(s.replace(/[$€₩,%\s]/g, ''))

export const isNumeric = (s: string): boolean => {
  if (s === '') return false
  return Number.isFinite(numericValue(s))
}

export const pad2 = (n: number): string => String(n).padStart(2, '0')
