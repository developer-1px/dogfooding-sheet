import { cellKey, colIndex, columnLabel, type CellRef, type Display, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'

export const MAX_TSV_TEXT_LENGTH = 5_000_000

const isSafeTsvText = (tsv: string): boolean => tsv.length <= MAX_TSV_TEXT_LENGTH

const splitLimited = (value: string, separator: string, limit: number): string[] => {
  if (limit <= 0) return []
  return Number.isFinite(limit) ? value.split(separator, limit) : value.split(separator)
}

const boundedCount = (maxExclusive: number | undefined, start: number): number => {
  if (maxExclusive === undefined) return Infinity
  const count = Math.floor(maxExclusive) - start
  return Number.isFinite(count) ? Math.max(0, count) : Infinity
}

const boundedEnd = (endInclusive: number, maxExclusive: number | undefined): number => {
  if (maxExclusive === undefined) return endInclusive
  const end = Math.floor(maxExclusive) - 1
  return Number.isFinite(end) ? Math.min(endInclusive, end) : endInclusive
}

const splitTsvRows = (tsv: string, rowLimit: number): string[] =>
  splitLimited(tsv.replace(/\r\n?/g, '\n').replace(/\n$/, ''), '\n', rowLimit)

const splitTsvCols = (row: string, colLimit: number): string[] =>
  splitLimited(row, '\t', colLimit)

export function rectToTsv(rect: Rect, get: Display): string {
  const rows: string[] = []
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    const cols: string[] = []
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      cols.push(get(cellKey(columnLabel(c), r)))
    }
    rows.push(cols.join('\t'))
  }
  return rows.join('\n')
}

export function writesFromTsv(
  tsv: string,
  anchor: CellRef,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  if (!isSafeTsvText(tsv)) return []
  const c0 = colIndex(anchor.col)
  const rowLimit = boundedCount(bounds.maxRow, anchor.row)
  const colLimit = boundedCount(bounds.maxCol, c0)
  const rows = splitTsvRows(tsv, rowLimit)
  const writes: Writes = []
  for (let r = 0; r < rows.length; r++) {
    const cols = splitTsvCols(rows[r], colLimit)
    for (let c = 0; c < cols.length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = columnLabel(tc)
      if (!col) continue
      writes.push([cellKey(col, tr), cols[c]])
    }
  }
  return writes
}

export function writesFromTsvToRect(
  tsv: string,
  target: Rect,
  bounds: { maxRow?: number; maxCol?: number } = {},
): Writes {
  if (!isSafeTsvText(tsv)) return []
  const targetRMax = boundedEnd(target.rMax, bounds.maxRow)
  const targetCMax = boundedEnd(target.cMax, bounds.maxCol)
  if (targetRMax < target.rMin || targetCMax < target.cMin) return []
  const rowLimit = targetRMax - target.rMin + 1
  const colLimit = targetCMax - target.cMin + 1
  const rows = splitTsvRows(tsv, rowLimit)
  const source = rows.map((row) => splitTsvCols(row, colLimit))
  const writes: Writes = []
  for (let r = target.rMin; r <= targetRMax; r++) {
    const sourceRow = source[(r - target.rMin) % source.length] ?? ['']
    for (let c = target.cMin; c <= targetCMax; c++) {
      const col = columnLabel(c)
      if (!col) continue
      const value = sourceRow[(c - target.cMin) % sourceRow.length] ?? ''
      writes.push([cellKey(col, r), value])
    }
  }
  return writes
}
