interface Props {
  selectedIds: string[]
  display: (k: string) => string
  parseId: (id: string) => { col: string; row: number } | null
}

export function StatusBar({ selectedIds, display, parseId }: Props) {
  if (selectedIds.length < 2) return <footer className="status-bar"><span>{selectedIds.length} 셀</span></footer>

  const nums: number[] = []
  for (const id of selectedIds) {
    const p = parseId(id)
    if (!p) continue
    const v = display(`${p.col}${p.row + 1}`)
    const n = Number(v)
    if (Number.isFinite(n) && v.trim() !== '') nums.push(n)
  }
  const sum = nums.reduce((a, b) => a + b, 0)
  const avg = nums.length ? sum / nums.length : 0
  const min = nums.length ? Math.min(...nums) : 0
  const max = nums.length ? Math.max(...nums) : 0
  const fmt = (n: number) => Math.round(n * 1e6) / 1e6

  return (
    <footer className="status-bar">
      <span>{selectedIds.length} 셀</span>
      {nums.length > 0 && (
        <>
          <span>SUM: <b>{fmt(sum)}</b></span>
          <span>AVG: <b>{fmt(avg)}</b></span>
          <span>MIN: <b>{fmt(min)}</b></span>
          <span>MAX: <b>{fmt(max)}</b></span>
          <span>COUNT: <b>{nums.length}</b></span>
        </>
      )}
    </footer>
  )
}
