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

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let buf = ''
  let inQ = false
  let quoteClosed = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { buf += '"'; i++ }
        else { inQ = false; quoteClosed = true }
      } else buf += ch
    } else {
      if (quoteClosed && ch !== ',' && ch !== '\n' && ch !== '\r') throw new Error('Invalid CSV')
      if (ch === '"') {
        if (buf) buf += ch
        else inQ = true
      } else if (ch === ',') { cur.push(buf); buf = ''; quoteClosed = false }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        cur.push(buf); buf = ''; quoteClosed = false
        rows.push(cur); cur = []
      } else buf += ch
    }
  }
  if (inQ) throw new Error('Invalid CSV')
  if (buf || cur.length || quoteClosed) { cur.push(buf); rows.push(cur) }
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
  importCsvRowsInto(parseCsv(text), write, opts)
}
