import { numericValue } from '../lib/numeric'
import { cellKey, type Display, type CellRef } from './schema'

interface Props {
  selectedIds: string[]
  display: Display
  parseId: (id: string) => CellRef | null
}

export function StatusBar({ selectedIds, display, parseId }: Props) {
  if (selectedIds.length < 2) return <footer className="status-bar" role="status" aria-live="polite"><span>{selectedIds.length} 셀</span></footer>

  const rows = new Set<number>(), cols = new Set<string>()
  const nums: number[] = []
  let nonEmpty = 0
  for (const id of selectedIds) {
    const p = parseId(id)
    if (!p) continue
    rows.add(p.row); cols.add(p.col)
    const v = display(cellKey(p.col, p.row))
    if (v.trim() !== '') nonEmpty++
    const n = numericValue(v)
    if (Number.isFinite(n)) nums.push(n)
  }
  const sum = nums.reduce((a, b) => a + b, 0)
  const avg = nums.length ? sum / nums.length : 0
  const min = nums.length ? Math.min(...nums) : 0
  const max = nums.length ? Math.max(...nums) : 0
  const median = nums.length
    ? (() => { const s = [...nums].sort((a, b) => a - b); const m = s.length; return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2 })()
    : 0
  const fmt = (n: number) => Math.round(n * 1e6) / 1e6

  return (
    <footer className="status-bar" role="status" aria-live="polite">
      <span>{selectedIds.length} 셀 ({rows.size}행 × {cols.size}열)</span>
      <span>COUNTA: <b>{nonEmpty}</b></span>
      {nums.length > 0 && (
        <>
          <span>SUM: <b>{fmt(sum)}</b></span>
          <span>AVG: <b>{fmt(avg)}</b></span>
          <span>MIN: <b>{fmt(min)}</b></span>
          <span>MAX: <b>{fmt(max)}</b></span>
          <span>COUNT: <b>{nums.length}</b></span>
          <span>MEDIAN: <b>{fmt(median)}</b></span>
        </>
      )}
    </footer>
  )
}
