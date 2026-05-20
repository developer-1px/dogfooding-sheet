import { cellKey, colIndex, columnLabel, type CellRef, type Display, type Writes } from '../coordinates/a1'
import type { Rect } from '../geometry/rect'

export const MAX_TSV_TEXT_LENGTH = 5_000_000

export const isSafeTsvText = (tsv: string): boolean => tsv.length <= MAX_TSV_TEXT_LENGTH

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

export const parseTsvMatrix = (tsv: string, rowLimit: number, colLimit: number): string[][] =>
  splitTsvRows(tsv, rowLimit).map((row) => splitTsvCols(row, colLimit))

export function rectToTsvBounded(rect: Rect, get: Display, maxLength = MAX_TSV_TEXT_LENGTH): string | null {
  const parts: string[] = []
  let length = 0
  const push = (value: string): boolean => {
    length += value.length
    if (length > maxLength) return false
    parts.push(value)
    return true
  }
  for (let r = rect.rMin; r <= rect.rMax; r++) {
    if (r > rect.rMin && !push('\n')) return null
    for (let c = rect.cMin; c <= rect.cMax; c++) {
      if (c > rect.cMin && !push('\t')) return null
      if (!push(get(cellKey(columnLabel(c), r)))) return null
    }
  }
  return parts.join('')
}

export function rectToTsv(rect: Rect, get: Display): string {
  return rectToTsvBounded(rect, get) ?? ''
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
  const rows = parseTsvMatrix(tsv, rowLimit, colLimit)
  const writes: Writes = []
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const tr = anchor.row + r
      const tc = c0 + c
      const col = columnLabel(tc)
      if (!col) continue
      writes.push([cellKey(col, tr), rows[r][c]])
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
  const source = parseTsvMatrix(tsv, rowLimit, colLimit)
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
