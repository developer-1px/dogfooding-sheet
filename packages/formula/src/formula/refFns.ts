import { parseA1, cellKey, colIndex, columnLabel } from '../a1'
import { smartReturn } from './marker'
import { dispatchRefArray } from './refArrayFns'
import type { RefCtx } from './refMatrix'

export function dispatchRef(F: string, argsT: string[], rawArgs: string, c: RefCtx): string | null {
  const array = dispatchRefArray(F, argsT, rawArgs, c)
  if (array !== null) return array

  if (F === 'OFFSET') {
    const base = (rawArgs.split(',')[0] ?? '').trim()
    const p = parseA1(base)
    if (!p) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = colIndex(p.col) + dc, row = p.row + dr
    if (!Number.isSafeInteger(Math.trunc(col)) || !Number.isSafeInteger(Math.trunc(row)) || col < 0 || row < 0) return smartReturn('#REF!')
    const ref = cellKey(columnLabel(Math.trunc(col)), Math.trunc(row))
    return smartReturn(c.evalCell(ref))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    const p = parseA1(ref)
    if (!p) return smartReturn('#REF!')
    return smartReturn(c.evalCell(cellKey(p.col, p.row)))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    const row = Math.trunc(r)
    const colIndex = Math.trunc(col) - 1
    if (!Number.isSafeInteger(row) || !Number.isSafeInteger(colIndex) || row < 1 || colIndex < 0) return smartReturn('#VALUE!')
    return smartReturn(columnLabel(colIndex) + row)
  }
  return null
}
