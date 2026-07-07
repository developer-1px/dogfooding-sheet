import { cellKey, colIndex, parseCellId, type Cells, type WriteCell } from './schema'
import type { SheetMutations } from './structure/sheetMutations'
import type { FreezeActions, FreezeState } from './visibility/useFreeze'
import type { HiddenActions } from './visibility/useHidden'
import type { NoteLookup } from './useNotes'
import type { MenuItem } from './ContextMenu'
import { copySingleCell, cutSingleCell, pasteSingleCell, type ClipboardTextBridge } from './clipboard/clipboardActions'
import { columnRestoreControls, rowRestoreControls } from './grid-view/hiddenRestoreControls'

export type CellMenuKind = 'cell' | 'row' | 'col'
export type CellMenuEntry = MenuItem | 'separator'

export interface CellMenuActions
  extends SheetMutations,
  Pick<FreezeActions, 'setFreezeRows' | 'setFreezeCols'>,
  Pick<HiddenActions, 'hideRow' | 'hideCol' | 'showRow' | 'showCol'> {
  sheet: { cells: Cells }
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
    { label: '위에 행 삽입', onClick: () => a.insertRow(row) },
    { label: '아래 행 삽입', onClick: () => a.insertRow(row + 1) },
    { label: '행 삭제', onClick: () => a.deleteRow(row) },
    { label: `${row + 1}행 숨기기`, onClick: () => a.hideRow(row) },
    ...rowRevealItems(a, row),
    { label: `${row + 1}행 높이…`, onClick: () => a.promptRowHeight(row) },
    'separator',
    rowFreezeItem(a, row),
    mergeSelectionItem(a),
  ]
}

function colMenuItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  return [
    { label: `${col}열 왼쪽에 삽입`, onClick: () => a.insertCol(col) },
    { label: `${col}열 삭제`, onClick: () => a.deleteCol(col) },
    { label: `${col}열 숨기기`, onClick: () => a.hideCol(col) },
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
    { label: '지우기', onClick: () => a.writeCell(key, '') },
    'separator',
    { label: note ? '노트 편집' : '노트 추가', onClick: () => a.editNote(key) },
    ...(note ? [{ label: '노트 삭제', onClick: () => a.setNote(key, '') }] : []),
    { label: '하이퍼링크 삽입 (Ctrl/⌘+K)', onClick: a.insertLink, keyShortcuts: 'Control+K Meta+K' },
    'separator',
    { label: '위에 행 삽입', onClick: () => a.insertRow(row) },
    { label: '아래 행 삽입', onClick: () => a.insertRow(row + 1) },
    { label: '행 삭제', onClick: () => a.deleteRow(row) },
    { label: `${col}열 왼쪽에 삽입`, onClick: () => a.insertCol(col) },
    { label: `${col}열 삭제`, onClick: () => a.deleteCol(col) },
    { label: `${col}열 숨기기`, onClick: () => a.hideCol(col) },
    { label: `${row + 1}행 숨기기`, onClick: () => a.hideRow(row) },
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
  return [
    { label: a.filterCol === col ? '필터 수정…' : '필터 적용…', onClick: () => a.promptFilter(col) },
    ...(a.filterCol === col ? [{ label: '필터 해제', onClick: a.clearFilter }] : []),
  ]
}

function colSortItems(a: CellMenuActions, col: string): CellMenuEntry[] {
  return [
    { label: `${col} 오름차순 정렬`, onClick: () => a.sortByCol(col, 'asc') },
    { label: `${col} 내림차순 정렬`, onClick: () => a.sortByCol(col, 'desc') },
  ]
}

function mergeSelectionItem(a: CellMenuActions): MenuItem {
  return {
    label: '셀 병합 / 해제 (Alt+Shift+M)',
    onClick: a.mergeSelection,
    keyShortcuts: 'Alt+Shift+M',
  }
}

function rowFreezeItem(a: CellMenuActions, row: number): MenuItem {
  const freezeRows = row + 1
  const isFrozen = a.freeze.rows === freezeRows
  return {
    label: isFrozen ? '행 고정 해제' : `${freezeRows}행까지 고정`,
    onClick: () => a.setFreezeRows(isFrozen ? 0 : freezeRows),
  }
}

function colFreezeItem(a: CellMenuActions, col: string): MenuItem {
  const colPosition = colIndex(col) + 1
  const isFrozen = a.freeze.cols === colPosition
  return {
    label: isFrozen ? '열 고정 해제' : `${col}열까지 고정`,
    onClick: () => a.setFreezeCols(isFrozen ? 0 : colPosition),
  }
}
