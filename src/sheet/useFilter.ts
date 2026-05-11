import { useState } from 'react'
import { cellKey, type Display } from '../lib/a1'

export interface Filter { col: string; text: string }

export function useFilter() {
  const [filter, setFilter] = useState<Filter | null>(null)

  const apply = (col: string, text: string) => {
    if (!text) setFilter(null)
    else setFilter({ col, text: text.toLowerCase() })
  }

  const clear = () => setFilter(null)

  return { filter, apply, clear }
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
    const v = display(cellKey(filter.col, r)).toLowerCase()
    if (!v.includes(filter.text)) out.add(r)
  }
  return out
}
