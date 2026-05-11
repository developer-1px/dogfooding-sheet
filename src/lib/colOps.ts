import { COL_LETTERS, colIndex, parseA1, cellKey, type Cells } from './a1'


const REF_RE = /([A-J])(\d+)/g
const idxCol = (i: number) => COL_LETTERS[i]

const shiftFormulaCols = (raw: string, fromCol: number, delta: number): string => {
  if (!raw.startsWith('=')) return raw
  return '=' + raw.slice(1).replace(REF_RE, (m, c: string, r: string) => {
    const ci = colIndex(c)
    if (ci < fromCol) return m
    const nc = idxCol(ci + delta)
    return nc ? `${nc}${r}` : '#REF!'
  })
}

export function insertCol(cells: Cells, atCol: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const ci = colIndex(p.col)
    const shifted = shiftFormulaCols(v, atCol, 1)
    if (ci < atCol) next[k] = shifted
    else { const nc = idxCol(ci + 1); if (nc) next[cellKey(nc, p.row)] = shifted }
  }
  return next
}

export function deleteCol(cells: Cells, atCol: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const p = parseA1(k)
    if (!p) continue
    const ci = colIndex(p.col)
    if (ci === atCol) continue
    let shifted = v
    if (v.startsWith('=')) {
      shifted = '=' + v.slice(1).replace(REF_RE, (mm, cc: string, rr: string) => {
        const ix = colIndex(cc)
        if (ix === atCol) return '#REF!'
        if (ix > atCol) return `${idxCol(ix - 1)}${rr}`
        return mm
      })
    }
    if (ci < atCol) next[k] = shifted
    else { const nc = idxCol(ci - 1); if (nc) next[cellKey(nc, p.row)] = shifted }
  }
  return next
}
