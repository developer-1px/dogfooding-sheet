import { appendIdsForCol, appendIdsForRow, idsForAll, idsForCol } from '@spredsheet/grid'
import { cellId, parseCellId } from '../../../entities/Sheet/schema'

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
  let selectedIds: string[]
  if (anchorIndex < 0 || targetIndex < 0) {
    selectedIds = idsForCol(targetCol, rowCount)
  } else {
    selectedIds = []
    for (let col = Math.min(anchorIndex, targetIndex); col <= Math.max(anchorIndex, targetIndex); col++) {
      appendIdsForCol(selectedIds, colLetters[col], rowCount)
    }
  }
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
  const selectedIds: string[] = []
  for (let row = Math.min(targetRow, anchorRow); row <= Math.max(targetRow, anchorRow); row++) {
    appendIdsForRow(selectedIds, row, colLetters)
  }
  const focusId = cellId('A', targetRow)

  return {
    focusId,
    anchorId: focusId,
    selectedIds,
  }
}
