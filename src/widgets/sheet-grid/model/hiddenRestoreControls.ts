import { colIndex } from '../../../entities/Sheet/schema'

export interface ColumnRestoreControl {
  col: string
  className: 'unhide-col left' | 'unhide-col right'
  marker: '‹' | '›'
  label: string
}

export interface RowRestoreControl {
  row: number
  className: 'unhide-row top' | 'unhide-row bottom'
  marker: '⌃' | '⌄'
  label: string
}

export function columnRestoreControls(
  col: string,
  colLetters: readonly string[],
  hiddenCols: ReadonlySet<string>,
): ColumnRestoreControl[] {
  const index = colIndex(col)
  const prev = colLetters[index - 1]
  const next = colLetters[index + 1]
  const controls: ColumnRestoreControl[] = []

  if (prev && hiddenCols.has(prev)) {
    controls.push({ col: prev, className: 'unhide-col left', marker: '‹', label: `${prev}열 숨김 표시` })
  }
  if (next && hiddenCols.has(next)) {
    controls.push({ col: next, className: 'unhide-col right', marker: '›', label: `${next}열 숨김 표시` })
  }

  return controls
}

export function rowRestoreControls(row: number, hiddenRows: ReadonlySet<number>): RowRestoreControl[] {
  const controls: RowRestoreControl[] = []

  if (hiddenRows.has(row - 1)) {
    controls.push({ row: row - 1, className: 'unhide-row top', marker: '⌃', label: `${row}행 숨김 표시` })
  }
  if (hiddenRows.has(row + 1)) {
    controls.push({ row: row + 1, className: 'unhide-row bottom', marker: '⌄', label: `${row + 2}행 숨김 표시` })
  }

  return controls
}
