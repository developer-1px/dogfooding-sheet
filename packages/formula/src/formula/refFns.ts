import type { Eval } from './args'
import { COL_LETTERS, parseA1, cellKey, colIndex, type Cells } from '../a1'
import { evalCell as evalRangeCell, parseRange } from './rangeRect'
import { smartReturn } from './marker'


interface Ctx { cells: Cells; evalRaw: Eval }

export function dispatchRef(F: string, argsT: string[], rawArgs: string, c: Ctx): string | null {
  if (F === 'RANGEDIM') {
    const raw = (rawArgs ?? '').trim()
    const r = raw.includes(':') ? parseRange(raw) : null
    if (!r) return smartReturn('#REF!')
    return smartReturn(`${r.rMax - r.rMin + 1}×${r.cMax - r.cMin + 1}`)
  }
  if (F === 'ROWS' || F === 'COLUMNS') {
    const r = parseRange((rawArgs ?? '').trim())
    if (!r) return smartReturn('#REF!')
    return smartReturn(String(F === 'ROWS' ? r.rMax - r.rMin + 1 : r.cMax - r.cMin + 1))
  }
  if (F === 'TRANSPOSE') {
    const r = parseRange((rawArgs ?? '').trim())
    if (!r) return smartReturn('#REF!')
    const rows: string[][] = []
    for (let col = r.cMin; col <= r.cMax; col++) {
      const row: string[] = []
      for (let rr = r.rMin; rr <= r.rMax; rr++) {
        row.push(evalRangeCell(c.cells, col, rr, c.evalRaw))
      }
      rows.push(row)
    }
    return smartReturn(JSON.stringify(rows))
  }
  if (F === 'SEQUENCE') {
    const rowCount = Math.trunc(Number(argsT[0]))
    const colCount = Math.trunc(Number(argsT[1] ?? '1'))
    const start = Number(argsT[2] ?? '1')
    const step = Number(argsT[3] ?? '1')
    if (
      !Number.isFinite(rowCount) || !Number.isFinite(colCount) ||
      !Number.isFinite(start) || !Number.isFinite(step) ||
      rowCount < 1 || colCount < 1
    ) return smartReturn('#VALUE!')
    const rows: string[][] = []
    for (let row = 0; row < rowCount; row++) {
      const values: string[] = []
      for (let col = 0; col < colCount; col++) {
        values.push(String(start + (row * colCount + col) * step))
      }
      rows.push(values)
    }
    return smartReturn(JSON.stringify(rows))
  }
  if (F === 'OFFSET') {
    const base = (rawArgs.split(',')[0] ?? '').trim()
    const p = parseA1(base)
    if (!p) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = colIndex(p.col) + dc, row = p.row + dr
    if (col < 0 || col > 9 || row < 0) return smartReturn('#REF!')
    const ref = cellKey(COL_LETTERS[col], row)
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    const p = parseA1(ref)
    if (!p) return smartReturn('#REF!')
    return smartReturn(c.evalRaw(c.cells[cellKey(p.col, p.row)] ?? ''))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  return null
}
