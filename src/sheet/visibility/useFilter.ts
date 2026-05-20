import { useState } from 'react'
import { cellKey, type Display } from '../schema'
import { isSafeCellText } from '../cellValue'

export interface Filter { col: string; text: string }

export const normalizeFilterText = (text: string): string | null => {
  const value = text.trim()
  if (value === '') return ''
  return isSafeCellText(value) ? value.toLowerCase() : null
}

export function useFilter() {
  const [filter, setFilter] = useState<Filter | null>(null)

  const apply = (col: string, text: string) => {
    const normalized = normalizeFilterText(text)
    if (normalized === '') setFilter(null)
    else if (normalized !== null) setFilter({ col, text: normalized })
  }

  const clear = () => setFilter(null)

  return { filter, apply, clear }
}

const coerceNumber = (value: string): number => {
  const s = value.trim()
  if (s === '') return NaN
  const percent = s.endsWith('%')
  const raw = (percent ? s.slice(0, -1) : s)
    .replace(/^[+$€₩¥£]\s*/, '')
    .replace(/\s*[€₩¥£]$/, '')
    .replace(/,/g, '')
  const n = Number(raw)
  return Number.isFinite(n) ? (percent ? n / 100 : n) : NaN
}

export const matchesWildcard = (value: string, pattern: string): boolean => {
  const text = value.toLowerCase()
  const query = pattern.toLowerCase()
  let ti = 0
  let pi = 0
  let star = -1
  let afterStar = 0

  while (ti < text.length) {
    if (query[pi] === '?' || query[pi] === text[ti]) {
      ti++
      pi++
    } else if (query[pi] === '*') {
      star = pi
      afterStar = ti
      pi++
    } else if (star >= 0) {
      pi = star + 1
      afterStar++
      ti = afterStar
    } else {
      return false
    }
  }

  while (query[pi] === '*') pi++
  return pi === query.length
}

export function matchesFilter(value: string, query: string): boolean {
  const v = value.trim()
  const q = query.trim()
  if (q === '') return true
  for (const op of ['>=', '<=', '<>', '>', '<', '='] as const) {
    if (!q.startsWith(op)) continue
    const rhs = q.slice(op.length).trim()
    if (op === '<>') return v.toLowerCase() !== rhs.toLowerCase()
    if (op === '=') return v.toLowerCase() === rhs.toLowerCase()
    const a = coerceNumber(v)
    const b = coerceNumber(rhs)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false
    if (op === '>=') return a >= b
    if (op === '<=') return a <= b
    if (op === '>') return a > b
    if (op === '<') return a < b
  }
  if (/[*?]/.test(q)) return matchesWildcard(v, q)
  return v.toLowerCase().includes(q.toLowerCase())
}

/**
 * Returns the set of row indices (0-based) that should be hidden by `filter`.
 * Header row (index 0) is never hidden.
 */
export function hiddenRows(
  filter: Filter | null,
  rowCount: number,
  display: Display,
): Set<number> {
  const out = new Set<number>()
  if (!filter) return out
  for (let r = 1; r < rowCount; r++) {
    const v = display(cellKey(filter.col, r))
    if (!matchesFilter(v, filter.text)) out.add(r)
  }
  return out
}
