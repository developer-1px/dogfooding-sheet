import { idsForAll, idsForCol, idsForRow } from '@spredsheet/grid'
import { cellId, parseCellId } from '../schema'

export interface HeaderSelection {
  focusId: string
  anchorId: string
  selectedIds: string[]
}

export function selectAllHeaders(rowCount: number, colLetters: readonly string[]): HeaderSelection {
  const first = cellId('A', 0)
  return {
    focusId: first,
    anchorId: first,
    selectedIds: idsForAll(rowCount, colLetters),
  }
}

export function selectColumnHeader(
  targetCol: string,
  anchorCol: string | null,
  rowCount: number,
  colLetters: readonly string[],
): HeaderSelection {
  const anchorIndex = anchorCol ? colLetters.indexOf(anchorCol) : -1
  const targetIndex = colLetters.indexOf(targetCol)
  const selectedIds = anchorIndex < 0 || targetIndex < 0
    ? idsForCol(targetCol, rowCount)
    : colLetters
      .slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1)
      .flatMap((col) => idsForCol(col, rowCount))
  const focusId = cellId(targetCol, 0)

  return {
    focusId,
    anchorId: focusId,
    selectedIds,
  }
}

export function selectRowHeader(
  targetRow: number,
  anchorId: string | null,
  colLetters: readonly string[],
): HeaderSelection {
  const parsedAnchor = anchorId ? parseCellId(anchorId) : null
  const anchorRow = parsedAnchor?.row ?? targetRow
  const selectedIds = Array.from(
    { length: Math.abs(targetRow - anchorRow) + 1 },
    (_, offset) => Math.min(targetRow, anchorRow) + offset,
  ).flatMap((row) => idsForRow(row, colLetters))
  const focusId = cellId('A', targetRow)

  return {
    focusId,
    anchorId: focusId,
    selectedIds,
  }
}
