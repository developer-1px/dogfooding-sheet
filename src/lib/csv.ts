import { COL_LETTERS, cellKey, type Writes, type WriteCell, type WriteMany, type Display } from '@spredsheet/grid'

const CSV_NEEDS_QUOTE = /[",\n\r]/

const quote = (s: string) => CSV_NEEDS_QUOTE.test(s) ? `"${s.replace(/"/g, '""')}"` : s

interface ExportOpts { rowCount: number; colLetters?: readonly string[] }

export function exportCsv(get: Display, opts: ExportOpts): string {
  const { rowCount, colLetters = COL_LETTERS } = opts
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
  for (let r = 0; r <= lastRow; r++) {
    const cols: string[] = []
    for (let c = 0; c <= lastCol; c++) {
      cols.push(quote(get(cellKey(colLetters[c], r))))
    }
    lines.push(cols.join(','))
  }
  return lines.join('\n')
}

export interface ParseCsvOptions {
  maxRows?: number
  maxCols?: number
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

export function importCsvRowsInto(rows: readonly (readonly string[])[], write: WriteCell, opts: { rowCount: number; colLetters?: readonly string[]; writeMany?: WriteMany }) {
  const colLetters = opts.colLetters ?? COL_LETTERS
  const writes: Writes = []
  for (let r = 0; r < rows.length && r < opts.rowCount; r++) {
    for (let c = 0; c < rows[r].length && c < colLetters.length; c++) {
      writes.push([cellKey(colLetters[c], r), rows[r][c]])
    }
  }
  if (writes.length === 0) return
  if (opts.writeMany) opts.writeMany(writes); else for (const [k, v] of writes) write(k, v)
}

export function importCsvInto(text: string, write: WriteCell, opts: { rowCount: number; colLetters?: readonly string[]; writeMany?: WriteMany }) {
  const colLetters = opts.colLetters ?? COL_LETTERS
  importCsvRowsInto(parseCsv(text, { maxRows: opts.rowCount, maxCols: colLetters.length }), write, {
    ...opts,
    colLetters,
  })
}
