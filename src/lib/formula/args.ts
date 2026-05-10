import { stripText } from './marker'

type Cells = Record<string, string>

export interface Ctx {
  cells: Cells
  seen: Set<string>
  numFromCell: (ref: string) => number
  evalRaw: (raw: string) => string
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
  if (/^[A-J]\d+:[A-J]\d+$/.test(a)) return a
  if (/^[A-J]\d+$/.test(a)) return c.evalRaw(c.cells[a] ?? '')
  return stripText(c.evalRaw('=' + a))
}

export const evalArgs = (rawArgs: string, c: Ctx): string[] =>
  splitArgs(rawArgs).map((s) => argString(s, c))
