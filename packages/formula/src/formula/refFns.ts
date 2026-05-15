import type { Eval } from './args'
import { COL_LETTERS, parseA1, cellKey, colIndex, type Cells } from '../a1'
import { parseRange } from './rangeRect'
import { smartReturn } from './marker'


interface Ctx { cells: Cells; evalRaw: Eval }

export function dispatchRef(F: string, argsT: string[], rawArgs: string, c: Ctx): string | null {
  if (F === 'RANGEDIM') {
    const raw = (rawArgs ?? '').trim()
    const r = raw.includes(':') ? parseRange(raw) : null
    if (!r) return smartReturn('#REF!')
    return smartReturn(`${r.rMax - r.rMin + 1}×${r.cMax - r.cMin + 1}`)
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
    if (!/^[A-Z]\d+$/.test(ref)) return smartReturn('#REF!')
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  return null
}
