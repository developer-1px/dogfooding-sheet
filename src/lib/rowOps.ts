type Cells = Record<string, string>

const REF_RE = /([A-J])(\d+)/g

const shiftFormulaRefs = (raw: string, fromRow: number, delta: number, rowCount: number): string => {
  if (!raw.startsWith('=')) return raw
  return '=' + raw.slice(1).replace(REF_RE, (m, c: string, r: string) => {
    const row = Number(r)
    if (row < fromRow + 1) return m
    const newRow = row + delta
    if (newRow < 1 || newRow > rowCount) return '#REF!'
    return `${c}${newRow}`
  })
}

/**
 * Insert empty row at `atRow` (0-indexed). Cells at rows >= atRow shift down by 1.
 * The last row is dropped if it would overflow `rowCount`.
 */
export function insertRow(cells: Cells, atRow: number, rowCount: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const m = /^([A-J])(\d+)$/.exec(k)
    if (!m) continue
    const row = Number(m[2]) - 1
    const col = m[1]
    const shifted = shiftFormulaRefs(v, atRow, 1, rowCount)
    if (row < atRow) next[k] = shifted
    else if (row + 1 < rowCount) next[`${col}${row + 2}`] = shifted
  }
  return next
}

/**
 * Delete row at `atRow` (0-indexed). Cells at rows > atRow shift up by 1.
 * Refs pointing to the deleted row become `#REF!`.
 */
export function deleteRow(cells: Cells, atRow: number): Cells {
  const next: Cells = {}
  for (const [k, v] of Object.entries(cells)) {
    const m = /^([A-J])(\d+)$/.exec(k)
    if (!m) continue
    const row = Number(m[2]) - 1
    const col = m[1]
    if (row === atRow) continue
    let shifted = v
    if (v.startsWith('=')) {
      shifted = '=' + v.slice(1).replace(REF_RE, (mm, cc: string, rr: string) => {
        const r = Number(rr) - 1
        if (r === atRow) return '#REF!'
        if (r > atRow) return `${cc}${r}`
        return mm
      })
    }
    if (row < atRow) next[k] = shifted
    else next[`${col}${row}`] = shifted
  }
  return next
}
