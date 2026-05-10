import { useState } from 'react'
import { cellKey } from './schema'
import type { MenuItem } from './ContextMenu'

interface Args {
  sheet: { cells: Record<string, string> }
  setFocusId: (id: string) => void
  writeCell: (k: string, v: string) => void
  insertRow: (atRow: number) => void
  deleteRow: (atRow: number) => void
  insertCol: (col: string) => void
  deleteCol: (col: string) => void
  hideCol: (col: string) => void
  hideRow: (row: number) => void
  sortByCol: (col: string, dir: 'asc' | 'desc') => void
  noteOf: (k: string) => string | undefined
  setNote: (k: string, text: string) => void
  editNote: () => void
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
    const m = /^r(\d+)-([A-J])$/.exec(cellId)
    if (!m) return []
    const row = Number(m[1]); const col = m[2]; const k = cellKey(col, row)
    return [
      { label: '잘라내기', onClick: () => { navigator.clipboard?.writeText(a.sheet.cells[k] ?? ''); a.writeCell(k, '') } },
      { label: '복사', onClick: () => { navigator.clipboard?.writeText(a.sheet.cells[k] ?? '') } },
      { label: '붙여넣기', onClick: () => { navigator.clipboard?.readText().then((t) => a.writeCell(k, t)) } },
      { label: '지우기', onClick: () => a.writeCell(k, '') },
      'separator',
      { label: a.noteOf(k) ? '노트 편집' : '노트 추가', onClick: a.editNote },
      ...(a.noteOf(k) ? [{ label: '노트 삭제', onClick: () => a.setNote(k, '') }] : []),
      'separator',
      { label: '위에 행 삽입', onClick: () => a.insertRow(row) },
      { label: '아래 행 삽입', onClick: () => a.insertRow(row + 1) },
      { label: '행 삭제', onClick: () => a.deleteRow(row) },
      { label: `${col}열 왼쪽에 삽입`, onClick: () => a.insertCol(col) },
      { label: `${col}열 삭제`, onClick: () => a.deleteCol(col) },
      { label: `${col}열 숨기기`, onClick: () => a.hideCol(col) },
      { label: `${row + 1}행 숨기기`, onClick: () => a.hideRow(row) },
      'separator',
      { label: `${col} 오름차순 정렬`, onClick: () => a.sortByCol(col, 'asc') },
      { label: `${col} 내림차순 정렬`, onClick: () => a.sortByCol(col, 'desc') },
    ]
  }

  return { menu, open, close, items }
}
