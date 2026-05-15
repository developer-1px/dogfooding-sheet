import type { Cells } from '../a1'
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
  let buf = '', inQ = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '"') { inQ = !inQ; buf += ch }
    else if (ch === ',' && !inQ) { out.push(buf); buf = '' }
    else buf += ch
  }
  if (buf) out.push(buf)
  return out
}

export const argString = (raw: string, c: Ctx): string => {
  const a = raw.trim()
  if (a.startsWith('"') && a.endsWith('"')) return a.slice(1, -1).replace(/""/g, '"')
  if (/^[A-Z]\d+:[A-Z]\d+$/.test(a)) return a
  if (/^[A-Z]\d+$/.test(a)) return c.evalRaw(c.cells[a] ?? '')
  return stripText(c.evalRaw('=' + a))
}

export const evalArgs = (rawArgs: string, c: Ctx): string[] =>
  splitArgs(rawArgs).map((s) => argString(s, c))
