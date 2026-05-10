import { useShortcut } from '@p/aria-kernel/key'
import { cellKey, parseCellId, ROW_COUNT, type Sheet } from './schema'
import type { JsonOps } from 'zod-crud'
import { copyOrCut, pasteAt, freezeFormulas, insertNowOrToday } from '../lib/clipboardOps'
import { fillDown, fillRight } from '../lib/fillDown'
import { idsForAll } from '../lib/range'

export interface GlobalShortcutCtx {
  focusId: string | null
  selectedIds: string[]
  sheet: Sheet
  ops: JsonOps<Sheet>
  writeCell: (k: string, v: string) => void
  setSelectedIds: (ids: string[]) => void
  openFind: () => void
  openReplace: () => void
  openHelp: () => void
  openGoto: () => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  clearFormat: () => void
  saveCsv: () => void
  switchTab?: (delta: 1 | -1) => void
  display?: (k: string) => string
  applyFormat?: (key: 'plain' | 'currency' | 'percent' | 'date') => void
  editNote?: () => void
  insertLink?: () => void
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
  useShortcut('mod+g', () => get().openGoto())
  useShortcut('mod+k', () => get().insertLink?.())
  useShortcut('mod+a', () => get().setSelectedIds(idsForAll(ROW_COUNT)))
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
  useShortcut('F9', () => { const c = get(); if (c.display) freezeFormulas(targetIds(c), c.sheet.cells, c.display, c.writeCell) })

  const clearFocused = () => {
    const c = get()
    for (const id of targetIds(c)) {
      const pp = parseCellId(id)
      if (pp) c.writeCell(cellKey(pp.col, pp.row), '')
    }
  }
  useShortcut('Backspace', clearFocused)
  useShortcut('Delete', clearFocused)

  useShortcut('mod+c', () => { const c = get(); copyOrCut(targetIds(c), false, c.sheet.cells, c.writeCell) })
  useShortcut('mod+x', () => { const c = get(); copyOrCut(targetIds(c), true, c.sheet.cells, c.writeCell) })
  useShortcut('mod+v', () => { const c = get(); if (!c.focusId) return; const p = parseCellId(c.focusId); if (!p) return; pasteAt(cellKey(p.col, p.row), p, ROW_COUNT, c.writeCell) })
  useShortcut('mod+d', () => { const c = get(); if (c.selectedIds.length > 1) fillDown(c.selectedIds, c.sheet.cells, c.writeCell) })
  useShortcut('mod+r', () => { const c = get(); if (c.selectedIds.length > 1) fillRight(c.selectedIds, c.sheet.cells, c.writeCell) })
}
