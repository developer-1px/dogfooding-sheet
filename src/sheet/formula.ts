type Cells = Record<string, string>

const A1_RE = /([A-J])(\d+)/g
const RANGE_RE = /([A-J])(\d+):([A-J])(\d+)/g
const FUNC_RE = /(SUM|AVERAGE|MIN|MAX|COUNT)\(([^)]+)\)/gi

const expandRange = (a: string, ar: string, b: string, br: string): string[] => {
  const c1 = a.charCodeAt(0), c2 = b.charCodeAt(0)
  const r1 = Number(ar), r2 = Number(br)
  const refs: string[] = []
  for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
      refs.push(String.fromCharCode(c) + r)
    }
  }
  return refs
}

const numFromCell = (cells: Cells, ref: string, seen: Set<string>): number => {
  const v = evaluate(cells, cells[ref] ?? '', seen)
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function evaluate(cells: Cells, raw: string, seen: Set<string> = new Set()): string {
  if (!raw.startsWith('=')) return raw
  let expr = raw.slice(1)

  expr = expr.replace(FUNC_RE, (_m, fn: string, args: string) => {
    const refs: string[] = []
    args.replace(RANGE_RE, (_x, a, ar, b, br) => {
      refs.push(...expandRange(a, ar, b, br))
      return ''
    })
    args.replace(A1_RE, (_x, c, r) => {
      const ref = `${c}${r}`
      if (!refs.includes(ref)) refs.push(ref)
      return ''
    })
    const nums = refs.map((r) => numFromCell(cells, r, seen))
    const F = fn.toUpperCase()
    if (F === 'SUM') return String(nums.reduce((a, b) => a + b, 0))
    if (F === 'AVERAGE') return String(nums.reduce((a, b) => a + b, 0) / Math.max(1, nums.length))
    if (F === 'MIN') return String(Math.min(...nums))
    if (F === 'MAX') return String(Math.max(...nums))
    if (F === 'COUNT') return String(nums.length)
    return '0'
  })

  expr = expr.replace(A1_RE, (_m, c, r) => {
    const ref = `${c}${r}`
    if (seen.has(ref)) return '0'
    seen.add(ref)
    const n = numFromCell(cells, ref, seen)
    seen.delete(ref)
    return String(n)
  })

  try {
    if (!/^[\d+\-*/().\s]+$/.test(expr)) return '#ERR'
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)()
    if (typeof result === 'number') {
      return Number.isFinite(result) ? String(Math.round(result * 1e10) / 1e10) : '#ERR'
    }
    return String(result)
  } catch {
    return '#ERR'
  }
}

export const evaluateCell = (cells: Cells, raw: string) => evaluate(cells, raw)
