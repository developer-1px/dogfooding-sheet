import { rectFromIds, rectToTsv, pasteTsv } from './clipboard'
import { cellKey, parseCellId } from '../sheet/schema'

type Cells = Record<string, string>

export function copyOrCut(
  ids: string[], cut: boolean, cells: Cells,
  writeCell: (k: string, v: string) => void,
): void {
  const rect = rectFromIds(ids)
  const tsv = rect ? rectToTsv(rect, (k) => cells[k] ?? '') : ''
  navigator.clipboard?.writeText(tsv).catch(() => {})
  if (cut) ids.forEach((id) => { const p = parseCellId(id); if (p) writeCell(cellKey(p.col, p.row), '') })
}

export function pasteAt(
  focusKey: string, p: { col: string; row: number }, maxRow: number,
  writeCell: (k: string, v: string) => void,
): void {
  navigator.clipboard?.readText()
    .then((t) => t.includes('\t') || t.includes('\n') ? pasteTsv(t, p, writeCell, { maxRow }) : writeCell(focusKey, t))
    .catch(() => {})
}
