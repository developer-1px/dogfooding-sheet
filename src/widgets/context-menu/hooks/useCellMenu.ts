import { useState } from 'react'
import { cellMenuItems, cellMenuLabel, type CellMenuActions, type CellMenuEntry, type CellMenuKind } from '../model/cellMenuItems'

interface Args extends CellMenuActions {
  setFocusId: (id: string) => void
}

export function useCellMenu(a: Args) {
  const [menu, setMenu] = useState<{ x: number; y: number; cellId: string; kind: CellMenuKind } | null>(null)

  const open = (x: number, y: number, cellId: string) => {
    a.setFocusId(cellId)
    setMenu({ x, y, cellId, kind: 'cell' })
  }
  const openRow = (x: number, y: number, cellId: string) => { a.setFocusId(cellId); setMenu({ x, y, cellId, kind: 'row' }) }
  const openCol = (x: number, y: number, cellId: string) => { a.setFocusId(cellId); setMenu({ x, y, cellId, kind: 'col' }) }
  const close = () => setMenu(null)
  const label = (kind: CellMenuKind = menu?.kind ?? 'cell') => cellMenuLabel(kind)
  const items = (cellId: string, kind: CellMenuKind = 'cell'): CellMenuEntry[] => cellMenuItems(a, cellId, kind)

  return { menu, open, openRow, openCol, close, items, label }
}
