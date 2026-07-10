import { COL_LETTERS, cellKey, type Rect, type Writes, type WriteCell, type WriteMany, type Display } from '@spredsheet/grid'

const CSV_NEEDS_QUOTE = /[",\n\r]/
export const MAX_CSV_EXPORT_LENGTH = 5_000_000

const quote = (s: string) => CSV_NEEDS_QUOTE.test(s) ? `"${s.replace(/"/g, '""')}"` : s

interface ExportOpts { rowCount: number; colLetters?: readonly string[]; maxLength?: number }

export function exportCsvBounded(get: Display, opts: ExportOpts): string | null {
  const { rowCount, colLetters = COL_LETTERS } = opts
  const maxLength = opts.maxLength ?? Infinity
  let lastRow = -1
  let lastCol = -1
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colLetters.length; c++) {
      if (get(cellKey(colLetters[c], r))) {
        if (r > lastRow) lastRow = r
        if (c > lastCol) lastCol = c
      }
    }
  }
  if (lastRow < 0) return ''
  const lines: string[] = []
  let length = 0
  const pushPart = (part: string): boolean => {
    length += part.length
    if (length > maxLength) return false
    return true
  }
  for (let r = 0; r <= lastRow; r++) {
    const cols: string[] = []
    if (r > 0 && !pushPart('\n')) return null
    for (let c = 0; c <= lastCol; c++) {
      if (c > 0 && !pushPart(',')) return null
      const value = quote(get(cellKey(colLetters[c], r)))
      if (!pushPart(value)) return null
      cols.push(value)
    }
    lines.push(cols.join(','))
  }
  return lines.join('\n')
}

export function exportCsv(get: Display, opts: ExportOpts): string {
  return exportCsvBounded(get, opts) ?? ''
}

export interface ParseCsvOptions {
  maxRows?: number
  maxCols?: number
}

type WriteCellRange = (range: Rect, matrix: readonly (readonly string[])[]) => boolean

interface ImportCsvOptions {
  rowCount: number
  colLetters?: readonly string[]
  writeMany?: WriteMany
  writeRange?: WriteCellRange
}

const boundedLimit = (value: number | undefined): number =>
  value === undefined || !Number.isFinite(value) ? Infinity : Math.max(0, Math.floor(value))

export function parseCsv(text: string, opts: ParseCsvOptions = {}): string[][] {
  const maxRows = boundedLimit(opts.maxRows)
  const maxCols = boundedLimit(opts.maxCols)
  const rows: string[][] = []
  let cur: string[] = []
  let buf = ''
  let inQ = false
  let quoteClosed = false
  let rowIndex = 0
  let colIndex = 0
  let fieldHasContent = false
  const shouldCaptureField = () => rowIndex < maxRows && colIndex < maxCols
  const append = (ch: string) => {
    fieldHasContent = true
    if (shouldCaptureField()) buf += ch
  }
  const pushField = () => {
    if (shouldCaptureField()) cur.push(buf)
    buf = ''
    quoteClosed = false
    fieldHasContent = false
    colIndex++
  }
  const pushRow = () => {
    if (rowIndex < maxRows) rows.push(cur)
    cur = []
    rowIndex++
    colIndex = 0
  }
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { append('"'); i++ }
        else { inQ = false; quoteClosed = true }
      } else append(ch)
    } else {
      if (quoteClosed && ch !== ',' && ch !== '\n' && ch !== '\r') throw new Error('Invalid CSV')
      if (ch === '"') {
        if (fieldHasContent) append(ch)
        else inQ = true
      } else if (ch === ',') { pushField() }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        pushField()
        pushRow()
      } else append(ch)
    }
  }
  if (inQ) throw new Error('Invalid CSV')
  if (fieldHasContent || colIndex > 0 || quoteClosed) {
    pushField()
    pushRow()
  }
  return rows
}

const boundedRows = (rows: readonly (readonly string[])[], opts: Required<Pick<ImportCsvOptions, 'rowCount' | 'colLetters'>>): string[][] =>
  rows.slice(0, opts.rowCount).map((row) => row.slice(0, opts.colLetters.length))

const rectangularRange = (matrix: readonly (readonly string[])[]): { range: Rect; matrix: string[][] } | null => {
  const width = matrix[0]?.length
  if (width === undefined || width === 0 || matrix.length === 0) return null
  if (!matrix.every((row) => row.length === width)) return null
  return {
    range: { rMin: 0, rMax: matrix.length - 1, cMin: 0, cMax: width - 1 },
    matrix: matrix.map((row) => [...row]),
  }
}

export function importCsvRowsInto(rows: readonly (readonly string[])[], write: WriteCell, opts: ImportCsvOptions) {
  const colLetters = opts.colLetters ?? COL_LETTERS
  const matrix = boundedRows(rows, { rowCount: opts.rowCount, colLetters })
  const rectangular = rectangularRange(matrix)
  if (rectangular && opts.writeRange?.(rectangular.range, rectangular.matrix)) return
  const writes: Writes = []
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      writes.push([cellKey(colLetters[c], r), matrix[r][c]])
    }
  }
  if (writes.length === 0) return
  if (opts.writeMany) opts.writeMany(writes); else for (const [k, v] of writes) write(k, v)
}

export function importCsvInto(text: string, write: WriteCell, opts: ImportCsvOptions) {
  const colLetters = opts.colLetters ?? COL_LETTERS
  importCsvRowsInto(parseCsv(text, { maxRows: opts.rowCount, maxCols: colLetters.length }), write, {
    ...opts,
    colLetters,
  })
}
