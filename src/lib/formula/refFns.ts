import type { Cells } from '../a1'
import { smartReturn } from './marker'


interface Ctx { cells: Cells; evalRaw: (s: string) => string }

export function dispatchRef(F: string, argsT: string[], rawArgs: string, c: Ctx): string | null {
  if (F === 'RANGEDIM') {
    const m = /^([A-J])(\d+):([A-J])(\d+)$/.exec((rawArgs ?? '').trim())
    if (!m) return smartReturn('#REF!')
    const cols = Math.abs(m[3].charCodeAt(0) - m[1].charCodeAt(0)) + 1
    const rows = Math.abs(Number(m[4]) - Number(m[2])) + 1
    return smartReturn(`${rows}×${cols}`)
  }
  if (F === 'OFFSET') {
    const base = (rawArgs.split(',')[0] ?? '').trim()
    const m = /^([A-J])(\d+)$/.exec(base)
    if (!m) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = m[1].charCodeAt(0) - 65 + dc, row = Number(m[2]) - 1 + dr
    if (col < 0 || col > 9 || row < 0) return smartReturn('#REF!')
    const ref = String.fromCharCode(65 + col) + (row + 1)
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    if (!/^[A-J]\d+$/.test(ref)) return smartReturn('#REF!')
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  return null
}
