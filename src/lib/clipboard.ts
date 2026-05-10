import { COL_LETTERS, parseCellId, cellKey, colIndex } from './a1'

export interface Rect { rMin: number; rMax: number; cMin: number; cMax: number }

export const formatRect = (rect: Rect): string => {
  const a = `${COL_LETTERS[rect.cMin]}${rect.rMin + 1}`
  const b = `${COL_LETTERS[rect.cMax]}${rect.rMax + 1}`
  return a === b ? a : `${a}:${b}`
}

export function rectFromIds(ids: string[]): Rect | null {
  const cells = ids.map(parseCellId).flatMap((x) => x ? [x] : [])
  if (cells.length === 0) return null
  let rMin = Infinity, rMax = -Infinity, cMin = Infinity, cMax = -Infinity
  for (const { col, row } of cells) {
    const ci = colIndex(col)
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
  bounds: { maxRow?: number; maxCol?: number; writeMany?: (writes: Array<[string, string]>) => void } = {},
) {
  const maxRow = bounds.maxRow ?? Infinity
  const maxCol = bounds.maxCol ?? COL_LETTERS.length
  const rows = tsv.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
  const c0 = colIndex(anchor.col)
  const writes: Array<[string, string]> = []
  for (let r = 0; r < rows.length; r++) {
    const cols = rows[r].split('\t')
    for (let c = 0; c < cols.length; c++) {
      const tr = anchor.row + r; const tc = c0 + c
      if (tr >= maxRow || tc >= maxCol) continue
      writes.push([cellKey(COL_LETTERS[tc], tr), cols[c]])
    }
  }
  if (writes.length === 0) return
  if (bounds.writeMany) bounds.writeMany(writes); else for (const [k, v] of writes) write(k, v)
}
