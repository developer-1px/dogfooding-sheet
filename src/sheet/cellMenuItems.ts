import { cellKey, colIndex, parseCellId, type Cells, type WriteCell } from './schema'
import type { SheetMutations } from './structure/sheetMutations'
import type { FreezeActions, FreezeState } from './visibility/useFreeze'
import type { HiddenActions } from './visibility/useHidden'
import type { NoteLookup } from './useNotes'
import type { MenuItem } from './ContextMenu'
import { copySingleCell, cutSingleCell, pasteSingleCell, type ClipboardTextBridge } from './clipboard/clipboardActions'
import { columnRestoreControls, rowRestoreControls } from './grid-view/hiddenRestoreControls'
import { canMergeSelection, type Merge } from './structure/mergeSelection'

export type CellMenuKind = 'cell' | 'row' | 'col'
export type CellMenuEntry = MenuItem | 'separator'

export interface CellMenuActions
  extends SheetMutations,
  Pick<FreezeActions, 'setFreezeRows' | 'setFreezeCols'>,
  Pick<HiddenActions, 'hideRow' | 'hideCol' | 'showRow' | 'showCol'> {
  sheet: { cells: Cells; merges: ReadonlyArray<Merge> }
  selectedIds: string[]
  focusId: string | null
  rowCount: number
  colLetters: readonly string[]
  hiddenRows: Set<number>
  hiddenCols: Set<string>
  filterCol: string | null
  clearFilter: () => void
  writeCell: WriteCell
  clipboardText?: ClipboardTextBridge
  noteOf: NoteLookup
  setNote: (k: string, text: string) => void
  editNote: (key?: string) => void
  insertLink: () => void
  promptRowHeight: (row: number) => void
  promptColWidth: (col: string) => void
  promptFilter: (col: string) => void
  freeze: FreezeState
  mergeSelection: () => void
}

export const cellMenuLabel = (kind: CellMenuKind = 'cell') =>
  kind === 'row' ? '행 헤더 컨텍스트 메뉴'
    : kind === 'col' ? '열 헤더 컨텍스트 메뉴'
      : '셀 컨텍스트 메뉴'

export function cellMenuItems(a: CellMenuActions, cellId: string, kind: CellMenuKind = 'cell'): CellMenuEntry[] {
  const p = parseCellId(cellId)
  if (!p) return []

  if (kind === 'row') return rowMenuItems(a, p.row)
  if (kind === 'col') return colMenuItems(a, p.col)
  return cellMenuItemsForAddress(a, p.row, p.col)
}

function rowMenuItems(a: CellMenuActions, row: number): CellMenuEntry[] {
  return [
    insertRowAboveItem(a, row),
    insertRowBelowItem(a, row),
    deleteRowItem(a, row),
    hideRowItem(a, row),
    ...rowRevealItems(a, row),
    { label: `${row + 1}행 높이…`, onClick: () => a.promptRowHeight(row) },
    'separator',
    rowFreezeItem(a, row),
    mergeSelectionItem(a),
  ]
}

function colMenuItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  return [
    insertColLeftItem(a, col),
    deleteColItem(a, col),
    hideColItem(a, col),
    ...colRevealItems(a, col),
    ...colFilterItems(a, col),
    { label: `${col}열 너비…`, onClick: () => a.promptColWidth(col) },
    'separator',
    colFreezeItem(a, col),
    mergeSelectionItem(a),
    'separator',
    ...colSortItems(a, col),
  ]
}

function cellMenuItemsForAddress(a: CellMenuActions, row: number, col: string): CellMenuEntry[] {
  const key = cellKey(col, row)
  const note = a.noteOf(key)

  return [
    { label: '잘라내기 (Ctrl/⌘+X)', onClick: () => cutSingleCell(a.sheet.cells[key] ?? '', key, a.writeCell, a.clipboardText), keyShortcuts: 'Control+X Meta+X' },
    { label: '복사 (Ctrl/⌘+C)', onClick: () => copySingleCell(a.sheet.cells[key] ?? '', a.clipboardText), keyShortcuts: 'Control+C Meta+C' },
    { label: '붙여넣기 (Ctrl/⌘+V)', onClick: () => pasteSingleCell(key, a.writeCell, a.clipboardText), keyShortcuts: 'Control+V Meta+V' },
    { label: '지우기 (Delete/Backspace)', onClick: () => a.writeCell(key, ''), keyShortcuts: 'Delete Backspace' },
    'separator',
    { label: note ? '노트 편집 (Ctrl/⌘+Shift+M)' : '노트 추가 (Ctrl/⌘+Shift+M)', onClick: () => a.editNote(key), keyShortcuts: 'Control+Shift+M Meta+Shift+M' },
    ...(note ? [{ label: '노트 삭제', onClick: () => a.setNote(key, '') }] : []),
    { label: '하이퍼링크 삽입 (Ctrl/⌘+K)', onClick: a.insertLink, keyShortcuts: 'Control+K Meta+K' },
    'separator',
    insertRowAboveItem(a, row),
    insertRowBelowItem(a, row),
    deleteRowItem(a, row),
    insertColLeftItem(a, col),
    deleteColItem(a, col),
    hideColItem(a, col),
    hideRowItem(a, row),
    { label: `${row + 1}행 높이…`, onClick: () => a.promptRowHeight(row) },
    { label: `${col}열 너비…`, onClick: () => a.promptColWidth(col) },
    rowFreezeItem(a, row),
    colFreezeItem(a, col),
    mergeSelectionItem(a),
    'separator',
    ...colSortItems(a, col),
  ]
}

function rowRevealItems(a: CellMenuActions, row: number): CellMenuEntry[] {
  return rowRestoreControls(row, a.hiddenRows)
    .map((control) => ({ label: control.label, onClick: () => a.showRow(control.row) }))
}

function colRevealItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  return columnRestoreControls(col, a.colLetters, a.hiddenCols)
    .map((control) => ({ label: control.label, onClick: () => a.showCol(control.col) }))
}

function colFilterItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  const disabled = a.rowCount <= 1
  const disabledLabel = a.filterCol === col
    ? `${col}열 필터를 수정할 데이터 행 없음`
    : `${col}열에 필터할 데이터 행 없음`
  return [
    { label: a.filterCol === col ? '필터 수정…' : '필터 적용…', onClick: () => a.promptFilter(col), disabled, disabledLabel },
    ...(a.filterCol === col ? [{ label: '필터 해제', onClick: a.clearFilter }] : []),
  ]
}

function colSortItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  const disabled = a.rowCount <= 1
  return [
    { label: `${col} 오름차순 정렬`, onClick: () => a.sortByCol(col, 'asc'), disabled, disabledLabel: `${col}열 오름차순 정렬할 데이터 행 없음` },
    { label: `${col} 내림차순 정렬`, onClick: () => a.sortByCol(col, 'desc'), disabled, disabledLabel: `${col}열 내림차순 정렬할 데이터 행 없음` },
  ]
}

function mergeSelectionItem(a: CellMenuActions): MenuItem {
  const canMerge = canMergeSelection(a.selectedIds, a.focusId, a.sheet.merges)
  return {
    label: '셀 병합 / 해제 (Alt+Shift+M)',
    onClick: () => { if (canMerge) a.mergeSelection() },
    disabled: !canMerge,
    disabledLabel: '병합 가능한 셀 범위 없음',
    keyShortcuts: 'Alt+Shift+M',
  }
}

function insertRowAboveItem(a: CellMenuActions, row: number): MenuItem {
  return {
    label: '위에 행 삽입 (Ctrl/⌘+Alt+=)',
    onClick: () => a.insertRow(row),
    keyShortcuts: 'Control+Alt+= Meta+Alt+=',
  }
}

function insertRowBelowItem(a: CellMenuActions, row: number): MenuItem {
  return {
    label: '아래 행 삽입',
    onClick: () => a.insertRow(row + 1),
    disabled: row + 1 >= a.rowCount,
    disabledLabel: '아래에 삽입할 행 위치 없음',
  }
}

function deleteRowItem(a: CellMenuActions, row: number): MenuItem {
  return {
    label: '행 삭제 (Ctrl/⌘+Alt+-)',
    onClick: () => a.deleteRow(row),
    keyShortcuts: 'Control+Alt+- Meta+Alt+-',
  }
}

function hideRowItem(a: CellMenuActions, row: number): MenuItem {
  return {
    label: `${row + 1}행 숨기기 (Ctrl/⌘+Alt+9)`,
    onClick: () => a.hideRow(row),
    keyShortcuts: 'Control+Alt+9 Meta+Alt+9',
    disabled: a.rowCount <= 1,
    disabledLabel: '숨기려면 하나 이상의 행이 더 필요함',
  }
}

function insertColLeftItem(a: CellMenuActions, col: string): MenuItem {
  return {
    label: `${col}열 왼쪽에 삽입 (Ctrl/⌘+Alt+Shift+=)`,
    onClick: () => a.insertCol(col),
    keyShortcuts: 'Control+Alt+Shift+= Meta+Alt+Shift+=',
  }
}

function deleteColItem(a: CellMenuActions, col: string): MenuItem {
  return {
    label: `${col}열 삭제 (Ctrl/⌘+Alt+Shift+-)`,
    onClick: () => a.deleteCol(col),
    keyShortcuts: 'Control+Alt+Shift+- Meta+Alt+Shift+-',
  }
}

function hideColItem(a: CellMenuActions, col: string): MenuItem {
  return {
    label: `${col}열 숨기기 (Ctrl/⌘+Alt+0)`,
    onClick: () => a.hideCol(col),
    keyShortcuts: 'Control+Alt+0 Meta+Alt+0',
    disabled: a.colLetters.length <= 1,
    disabledLabel: '숨기려면 하나 이상의 열이 더 필요함',
  }
}

function rowFreezeItem(a: CellMenuActions, row: number): MenuItem {
  const freezeRows = row + 1
  const isFrozen = a.freeze.rows === freezeRows
  return {
    label: isFrozen ? '행 고정 해제' : `${freezeRows}행까지 고정`,
    onClick: () => a.setFreezeRows(isFrozen ? 0 : freezeRows),
    disabled: !isFrozen && a.rowCount <= 1,
    disabledLabel: `${freezeRows}행까지 고정할 추가 행 없음`,
  }
}

function colFreezeItem(a: CellMenuActions, col: string): MenuItem {
  const colPosition = colIndex(col) + 1
  const isFrozen = a.freeze.cols === colPosition
  return {
    label: isFrozen ? '열 고정 해제' : `${col}열까지 고정`,
    onClick: () => a.setFreezeCols(isFrozen ? 0 : colPosition),
    disabled: !isFrozen && a.colLetters.length <= 1,
    disabledLabel: `${col}열까지 고정할 추가 열 없음`,
  }
}
