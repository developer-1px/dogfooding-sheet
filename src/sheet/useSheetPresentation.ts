import { useMemo } from 'react'
import { evaluateCell } from '@spredsheet/formula'
import { buildData } from './storage'
import { type Cells, type Display } from './schema'
import { applyFormat, type FormatLookup } from './formatting/useFormats'
import { hiddenRows, type Filter } from './visibility/useFilter'

export function createDisplay(cells: Cells, showFormulas: boolean, formatOf: FormatLookup): Display {
  const cache = new Map<string, string>()
  return (key) => {
    if (cache.has(key)) return cache.get(key)!
    const raw = cells[key] ?? ''
    const value = showFormulas ? raw : applyFormat(evaluateCell(cells, raw), formatOf(key))
    cache.set(key, value)
    return value
  }
}

interface Args {
  cells: Cells
  rowCount: number
  colLetters: string[]
  showFormulas: boolean
  formatOf: FormatLookup
  filter: Filter | null
  focusId: string | null
  selectedIds: string[]
  selectAnchor: string | null
}

export function useSheetPresentation({ cells, rowCount, colLetters, showFormulas, formatOf, filter, focusId, selectedIds, selectAnchor }: Args) {
  const display = useMemo(() => createDisplay(cells, showFormulas, formatOf), [cells, formatOf, showFormulas])

  const data = useMemo(() => {
    const next = buildData((key) => display(key), rowCount, colLetters)
    next.state = {
      ...next.state,
      activeKey: focusId,
      anchorKey: selectAnchor,
      extentKey: selectedIds.at(-1) ?? focusId,
      selectedKeys: selectedIds,
    }
    return next
  }, [colLetters, display, focusId, rowCount, selectAnchor, selectedIds])

  const hiddenRowSet = useMemo(() => hiddenRows(filter, rowCount, display), [display, filter, rowCount])

  return { display, data, hiddenRowSet }
}
