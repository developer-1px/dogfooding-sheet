import { useState } from 'react'
import { cellKey, colIndex, parseCellId, type Cells, type WriteCell } from './schema'
import type { SheetMutations } from './sheetMutations'
import type { FreezeState, FreezeActions } from './useFreeze'
import type { HiddenActions } from './useHidden'
import type { NoteLookup } from './useNotes'
import type { MenuItem } from './ContextMenu'

interface Args extends SheetMutations, Pick<FreezeActions, 'setFreezeRows' | 'setFreezeCols'>, Pick<HiddenActions, 'hideRow' | 'hideCol'> {
  sheet: { cells: Cells }
  setFocusId: (id: string) => void
  writeCell: WriteCell
  noteOf: NoteLookup
  setNote: (k: string, text: string) => void
  editNote: () => void
  insertLink: () => void
  promptRowHeight: (row: number) => void
  promptColWidth: (col: string) => void
  freeze: FreezeState
  mergeSelection: () => void
}

export function useCellMenu(a: Args) {
  const [menu, setMenu] = useState<{ x: number; y: number; cellId: string } | null>(null)

  const open = (e: React.MouseEvent, cellId: string) => {
    e.preventDefault()
    a.setFocusId(cellId)
    setMenu({ x: e.clientX, y: e.clientY, cellId })
  }
  const close = () => setMenu(null)

  const items = (cellId: string): Array<MenuItem | 'separator'> => {
    const p = parseCellId(cellId)
    if (!p) return []
    const row = p.row; const col = p.col; const k = cellKey(col, row)
    return [
      { label: '잘라내기', onClick: () => { navigator.clipboard?.writeText(a.sheet.cells[k] ?? ''); a.writeCell(k, '') } },
      { label: '복사', onClick: () => { navigator.clipboard?.writeText(a.sheet.cells[k] ?? '') } },
      { label: '붙여넣기', onClick: () => { navigator.clipboard?.readText().then((t) => a.writeCell(k, t)) } },
      { label: '지우기', onClick: () => a.writeCell(k, '') },
      'separator',
      { label: a.noteOf(k) ? '노트 편집' : '노트 추가', onClick: a.editNote },
      ...(a.noteOf(k) ? [{ label: '노트 삭제', onClick: () => a.setNote(k, '') }] : []),
      { label: '하이퍼링크 삽입', onClick: a.insertLink },
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
      { label: a.freeze.rows === row + 1 ? '행 고정 해제' : `${row + 1}행까지 고정`, onClick: () => a.setFreezeRows(a.freeze.rows === row + 1 ? 0 : row + 1) },
      { label: a.freeze.cols === colIndex(col) + 1 ? '열 고정 해제' : `${col}열까지 고정`, onClick: () => a.setFreezeCols(a.freeze.cols === colIndex(col) + 1 ? 0 : colIndex(col) + 1) },
      { label: '셀 병합 / 해제 (Alt+Shift+M)', onClick: a.mergeSelection },
      'separator',
      { label: `${col} 오름차순 정렬`, onClick: () => a.sortByCol(col, 'asc') },
      { label: `${col} 내림차순 정렬`, onClick: () => a.sortByCol(col, 'desc') },
    ]
  }

  return { menu, open, close, items }
}
