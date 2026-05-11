import { COL_LETTERS, cellKey, type Writes, type WriteCell, type WriteMany, type Display } from './a1'

const CSV_NEEDS_QUOTE = /[",\n\r]/

const quote = (s: string) => CSV_NEEDS_QUOTE.test(s) ? `"${s.replace(/"/g, '""')}"` : s

interface ExportOpts { rowCount: number }

export function exportCsv(get: Display, opts: ExportOpts): string {
  const { rowCount } = opts
  let lastRow = -1
  let lastCol = -1
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < COL_LETTERS.length; c++) {
      if (get(cellKey(COL_LETTERS[c], r))) {
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
      cols.push(quote(get(cellKey(COL_LETTERS[c], r))))
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
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { buf += '"'; i++ }
        else inQ = false
      } else buf += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === ',') { cur.push(buf); buf = '' }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++
        cur.push(buf); buf = ''
        rows.push(cur); cur = []
      } else buf += ch
    }
  }
  if (buf || cur.length) { cur.push(buf); rows.push(cur) }
  return rows
}

export function importCsvInto(text: string, write: WriteCell, opts: { rowCount: number; writeMany?: WriteMany }) {
  const rows = parseCsv(text)
  const writes: Writes = []
  for (let r = 0; r < rows.length && r < opts.rowCount; r++) {
    for (let c = 0; c < rows[r].length && c < COL_LETTERS.length; c++) {
      writes.push([cellKey(COL_LETTERS[c], r), rows[r][c]])
    }
  }
  if (writes.length === 0) return
  if (opts.writeMany) opts.writeMany(writes); else for (const [k, v] of writes) write(k, v)
}

export function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
