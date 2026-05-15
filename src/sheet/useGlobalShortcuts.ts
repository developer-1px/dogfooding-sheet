import { useShortcut } from '@interactive-os/aria-kernel/key'
import { cellKey, parseCellId, type Sheet, type SheetOps, type Writes, type WriteCell, type WriteMany, type Display } from './schema'
import { copyOrCut, pasteAt } from '../lib/clipboard'
import { fillDown, fillRight } from '../lib/fillDown'
import { idsForAll } from '../lib/range'
import { pad2 } from '../lib/numeric'

const freezeFormulas = (ids: string[], cells: Sheet['cells'], display: Display, writeCells: WriteMany) => {
  const writes: Writes = []
  for (const id of ids) {
    const p = parseCellId(id); if (!p) continue
    const k = cellKey(p.col, p.row)
    if ((cells[k] ?? '').startsWith('=')) writes.push([k, display(k)])
  }
  if (writes.length) writeCells(writes)
}

const insertNowOrToday = (focusId: string | null, withTime: boolean, writeCell: WriteCell) => {
  const p = focusId ? parseCellId(focusId) : null; if (!p) return
  const d = new Date()
  writeCell(cellKey(p.col, p.row), withTime
    ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
}

export interface GlobalShortcutCtx {
  focusId: string | null
  selectedIds: string[]
  sheet: Sheet
  rowCount: number
  colLetters: readonly string[]
  ops: SheetOps
  writeCell: WriteCell
  writeCells: WriteMany
  setSelectedIds: (ids: string[]) => void
  openFind: () => void
  openReplace: () => void
  openHelp: () => void
  openGoto: () => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrike: () => void
  clearFormat: () => void
  saveCsv: () => void
  switchTab?: (delta: 1 | -1) => void
  display?: Display
  applyFormat?: (key: 'plain' | 'currency' | 'percent' | 'date') => void
  editNote?: () => void
  insertLink?: () => void
  toggleShowFormulas?: () => void
  insertRowAtFocus?: () => void
  deleteRowAtFocus?: () => void
  insertColAtFocus?: () => void
  deleteColAtFocus?: () => void
  hideRowAtFocus?: () => void
  hideColAtFocus?: () => void
  showAll?: () => void
  mergeSelection?: () => void
}

const targetIds = (c: GlobalShortcutCtx) =>
  c.selectedIds.length > 0 ? c.selectedIds : (c.focusId ? [c.focusId] : [])

/** All modifier-bearing global shortcuts. Editable-guard handled per-call by aria-kernel. */
export function useGlobalShortcuts(get: () => GlobalShortcutCtx) {
  useShortcut('F1', () => get().openHelp())
  useShortcut('?', () => get().openHelp())
  useShortcut('mod+/', () => get().openHelp())
  useShortcut('mod+f', () => get().openFind())
  useShortcut('mod+h', () => get().openReplace())
  useShortcut('mod+s', () => get().saveCsv())
  useShortcut('mod+\\', () => get().clearFormat())
  useShortcut('mod+b', () => get().toggleBold())
  useShortcut('mod+i', () => get().toggleItalic())
  useShortcut('mod+u', () => get().toggleUnderline())
  useShortcut('alt+shift+5', () => get().toggleStrike())
  useShortcut('mod+g', () => get().openGoto())
  useShortcut('mod+k', () => get().insertLink?.())
  useShortcut('mod+`', () => get().toggleShowFormulas?.())
  useShortcut('mod+alt+=', () => get().insertRowAtFocus?.())
  useShortcut('mod+alt+-', () => get().deleteRowAtFocus?.())
  useShortcut('mod+alt+shift+=', () => get().insertColAtFocus?.())
  useShortcut('mod+alt+shift+-', () => get().deleteColAtFocus?.())
  useShortcut('mod+alt+9', () => get().hideRowAtFocus?.())
  useShortcut('mod+alt+0', () => get().hideColAtFocus?.())
  useShortcut('mod+shift+0', () => get().showAll?.())
  useShortcut('alt+shift+m', () => get().mergeSelection?.())
  useShortcut('mod+a', () => { const c = get(); c.setSelectedIds(idsForAll(c.rowCount, c.colLetters)) })
  useShortcut('mod+pageup', () => get().switchTab?.(-1))
  useShortcut('mod+pagedown', () => get().switchTab?.(1))
  useShortcut('mod+shift+m', () => get().editNote?.())
  useShortcut('mod+shift+1', () => get().applyFormat?.('plain'))
  useShortcut('mod+shift+3', () => get().applyFormat?.('date'))
  useShortcut('mod+shift+4', () => get().applyFormat?.('currency'))
  useShortcut('mod+shift+5', () => get().applyFormat?.('percent'))
  useShortcut('mod+;', () => insertNowOrToday(get().focusId, false, get().writeCell))
  useShortcut('mod+shift+;', () => insertNowOrToday(get().focusId, true, get().writeCell))
  useShortcut('mod+z', () => get().ops.undo())
  useShortcut('mod+shift+z', () => get().ops.redo())
  useShortcut('mod+y', () => get().ops.redo())
  useShortcut('F9', () => { const c = get(); if (c.display) freezeFormulas(targetIds(c), c.sheet.cells, c.display, c.writeCells) })

  const clearFocused = () => {
    const c = get()
    const writes: Writes = []
    for (const id of targetIds(c)) { const pp = parseCellId(id); if (pp) writes.push([cellKey(pp.col, pp.row), '']) }
    if (writes.length) c.writeCells(writes)
  }
  useShortcut('Backspace', clearFocused)
  useShortcut('Delete', clearFocused)

  useShortcut('mod+c', () => { const c = get(); copyOrCut(targetIds(c), false, c.sheet.cells, c.writeCell) })
  useShortcut('mod+x', () => { const c = get(); copyOrCut(targetIds(c), true, c.sheet.cells, c.writeCell, c.writeCells) })
  useShortcut('mod+v', () => { const c = get(); if (!c.focusId) return; const p = parseCellId(c.focusId); if (!p) return; pasteAt(cellKey(p.col, p.row), p, c.rowCount, c.writeCell, c.writeCells, c.colLetters.length) })
  useShortcut('mod+d', () => { const c = get(); if (c.selectedIds.length > 1) fillDown(c.selectedIds, c.sheet.cells, c.writeCell, c.writeCells) })
  useShortcut('mod+r', () => { const c = get(); if (c.selectedIds.length > 1) fillRight(c.selectedIds, c.sheet.cells, c.writeCell, c.writeCells) })
}
