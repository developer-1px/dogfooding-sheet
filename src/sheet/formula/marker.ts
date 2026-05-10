export const TM = '\x01'
export const wrap = (s: string) => TM + s + TM
export const stripText = (s: string) => s.startsWith(TM) && s.endsWith(TM) ? s.slice(1, -1) : s

/**
 * Wrap text/error results so the outer evaluator can preserve them as text;
 * leave plain numeric strings unwrapped so arithmetic continues to work.
 */
export const smartReturn = (v: string): string => {
  if (v === '') return v
  return Number.isFinite(Number(v)) && v.trim() !== '' && !v.startsWith('#') ? v : wrap(v)
}
