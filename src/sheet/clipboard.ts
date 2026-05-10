import { COL_LETTERS, ROW_COUNT, parseCellId, cellKey } from './schema'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

const colIdx = (c: string) => COL_LETTERS.indexOf(c as (typeof COL_LETTERS)[number])

export const formatRect = (rect: Rect): string => {
  const a = `${COL_LETTERS[rect.cMin]}${rect.rMin + 1}`
  const b = `${COL_LETTERS[rect.cMax]}${rect.rMax + 1}`
  return a === b ? a : `${a}:${b}`
}

export function rectFromIds(ids: string[]): Rect | null {
  const cells = ids.map(parseCellId).filter((x): x is { col: string; row: number } => !!x)
  if (cells.length === 0) return null
  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity
  for (const { col, row } of cells) {
    const ci = colIdx(col)
    if (row < rMin) rMin = row
    if (row > rMax) rMax = row
    if (ci < cMin) cMin = ci
    if (ci > cMax) cMax = ci
  }
  return { rMin, rMax, cMin, cMax }
}

export function rectToTsv(rect: Rect, get: (k: string) => string): string {
  const rows: string[] = []
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    const cols: string[] = []
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      cols.push(get(cellKey(COL_LETTERS[c], r)))
    }
    rows.push(cols.join('\t'))
  }
  return rows.join('\n')
}

export function pasteTsv(
  tsv: string,
  anchor: { col: string; row: number },
  write: (k: string, v: string) => void,
) {
  const rows = tsv.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  const c0 = colIdx(anchor.col)
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r].split('\t')
    for (let c = 0; c < cols.length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      if (tr >= ROW_COUNT || tc >= COL_LETTERS.length) continue
      write(cellKey(COL_LETTERS[tc], tr), cols[c])
    }
  }
}
