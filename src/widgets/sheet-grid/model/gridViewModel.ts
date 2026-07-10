import { parseCellId } from '../../../entities/Sheet/schema'

interface GridViewModelArgs {
  focusId: string | null
  selectedIds: readonly string[]
  rowCount: number
  colLetters: readonly string[]
  hiddenCols: ReadonlySet<string>
}

export function createGridViewModel({ focusId, selectedIds, rowCount, colLetters, hiddenCols }: GridViewModelArgs) {
  const focus = focusId ? parseCellId(focusId) : null
  const selectedCols = new Set<string>()
  const selectedRows = new Set<number>()

  for (const id of selectedIds) {
    const parsed = parseCellId(id)
    if (!parsed) continue
    selectedCols.add(parsed.col)
    selectedRows.add(parsed.row)
  }

  return {
    focusCol: focus?.col ?? null,
    focusRow: focus?.row ?? null,
    visibleCols: colLetters.filter((col) => !hiddenCols.has(col)),
    selectedCols,
    selectedRows,
    allSelected: selectedIds.length >= rowCount * colLetters.length,
  }
}
