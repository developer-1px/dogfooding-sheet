import type { Rect } from '../rect'

type Cells = Record<string, string>

export const parseRange = (s: string): Rect | null => {
  const m = /^([A-J])(\d+):([A-J])(\d+)$/.exec(s.trim())
  if (!m) {
    const single = /^([A-J])(\d+)$/.exec(s.trim())
    if (!single) return null
    const c = single[1].charCodeAt(0) - 65
    const r = Number(single[2]) - 1
    return { rMin: r, rMax: r, cMin: c, cMax: c }
  }
  const c1 = m[1].charCodeAt(0) - 65
  const c2 = m[3].charCodeAt(0) - 65
  return {
    rMin: Math.min(Number(m[2]), Number(m[4])) - 1,
    rMax: Math.max(Number(m[2]), Number(m[4])) - 1,
    cMin: Math.min(c1, c2),
    cMax: Math.max(c1, c2),
  }
}

export const evalCell = (cells: Cells, c: number, r: number, evalRaw: (s: string) => string): string =>
  evalRaw(cells[`${String.fromCharCode(65 + c)}${r + 1}`] ?? '')
