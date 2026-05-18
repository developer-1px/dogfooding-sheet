import type { Cells } from '../a1'
import { cellKey, parseA1 } from '../a1'
import { stripText } from './marker'

export type NumFromCell = (ref: string) => number
export type Eval = (s: string) => string

export interface Ctx {
  cells: Cells
  seen: Set<string>
  numFromCell: NumFromCell
  evalRaw: Eval
}

export const splitArgs = (s: string): string[] => {
  const out: string[] = []
  let buf = '', inQ = false, depth = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '"' && inQ && s[i + 1] === '"') { buf += '""'; i++ }
    else if (ch === '"') { inQ = !inQ; buf += ch }
    else if (ch === '(' && !inQ) { depth++; buf += ch }
    else if (ch === ')' && !inQ) { depth = Math.max(0, depth - 1); buf += ch }
    else if (ch === ',' && !inQ && depth === 0) { out.push(buf); buf = '' }
    else buf += ch
  }
  if (buf || s.length > 0) out.push(buf)
  return out
}

export const argString = (raw: string, c: Ctx): string => {
  const a = raw.trim()
  if (a === '') return ''
  if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1).replace(/""/g, '"')
  if (/^\$?[A-Z]\$?\d+:\$?[A-Z]\$?\d+$/.test(a)) return a
  if (/^\$?[A-Z]\$?\d+$/.test(a)) {
    const ref = parseA1(a)
    return ref ? c.evalRaw(c.cells[cellKey(ref.col, ref.row)] ?? '') : ''
  }
  return stripText(c.evalRaw('=' + a))
}

export const evalArgs = (rawArgs: string, c: Ctx): string[] =>
  splitArgs(rawArgs).map((s) => argString(s, c))
