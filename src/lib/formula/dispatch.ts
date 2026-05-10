import { vlookup, hlookup, xlookup, index as indexFn, match as matchFn } from './lookup'
import { aggregate, largeSmall, rank, sumproduct, percentile, quartile } from './aggregates'
import { countif, sumif, counta, countblank, averageif, countunique } from './condAggregates'
import { countifs, sumifs, minMaxIf } from './multiCriteria'
import { dispatchDate } from './dateFns'
import { dispatchTime } from './timeFns'
import { dispatchCalendar } from './calendar'
import { dispatchText } from './textFns'
import { dispatchRegex } from './regexFns'
import { dispatchMath } from './mathFns'
import { dispatchLogic } from './logicFns'
import { evalArgs, splitArgs, type Ctx } from './args'
import { smartReturn } from './marker'

export type { Ctx } from './args'
export { TM, stripText } from './marker'

export function dispatch(fn: string, rawArgs: string, c: Ctx): string {
  const F = fn.toUpperCase()

  if (F === 'ISFORMULA' || F === 'ISREF') {
    const ref = (rawArgs ?? '').trim()
    if (!/^[A-J]\d+$/.test(ref)) return F === 'ISREF' ? '0' : '#REF!'
    if (F === 'ISREF') return '1'
    return (c.cells[ref] ?? '').startsWith('=') ? '1' : '0'
  }
  if (F === 'ROW' || F === 'COLUMN') {
    const m = /^([A-J])(\d+)$/.exec((rawArgs ?? '').trim())
    if (!m) return '#REF!'
    return F === 'ROW' ? m[2] : String(m[1].charCodeAt(0) - 64)
  }

  const agg = aggregate(F, rawArgs, c.numFromCell)
  if (agg !== null) return agg

  const argsT = evalArgs(rawArgs, c)

  if (F === 'COUNTIF') return String(countif(argsT[0], argsT[1], c.cells, c.evalRaw))
  if (F === 'SUMIF') return String(sumif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'COUNTA') return String(counta(argsT[0], c.cells, c.evalRaw))
  if (F === 'COUNTBLANK') return String(countblank(argsT[0], c.cells, c.evalRaw))
  if (F === 'COUNTUNIQUE') return String(countunique(argsT[0], c.cells, c.evalRaw))
  if (F === 'AVERAGEIF') return String(averageif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'COUNTIFS') return String(countifs(argsT, c.cells, c.evalRaw))
  if (F === 'SUMIFS') return String(sumifs(argsT, c.cells, c.evalRaw))
  if (F === 'MINIFS' || F === 'MAXIFS') return String(minMaxIf(F === 'MINIFS' ? 'MIN' : 'MAX', argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'SUMPRODUCT') return sumproduct(splitArgs(rawArgs), c.numFromCell)
  if (F === 'LARGE' || F === 'SMALL') return smartReturn(largeSmall(F, splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'PERCENTILE') return smartReturn(percentile(splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'QUARTILE') return smartReturn(quartile(splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'RANK') return smartReturn(rank(Number(argsT[0]), splitArgs(rawArgs)[1], Number(argsT[2] ?? '0'), c.numFromCell))

  const argsN = argsT.map(Number)

  const date = dispatchDate(F, argsT); if (date !== null) return date
  const time = dispatchTime(F, argsT); if (time !== null) return time
  const cal = dispatchCalendar(F, argsT); if (cal !== null) return cal
  const text = dispatchText(F, argsT); if (text !== null) return text
  const rx = dispatchRegex(F, argsT); if (rx !== null) return rx
  const math = dispatchMath(F, argsT, argsN); if (math !== null) return math
  const logic = dispatchLogic(F, argsT, argsN); if (logic !== null) return logic

  if (F === 'VLOOKUP') return smartReturn(vlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw))
  if (F === 'HLOOKUP') return smartReturn(hlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw))
  if (F === 'OFFSET') {
    const base = (splitArgs(rawArgs)[0] ?? '').trim()
    const m = /^([A-J])(\d+)$/.exec(base)
    if (!m) return smartReturn('#REF!')
    const dr = Number(argsT[1]), dc = Number(argsT[2])
    const col = m[1].charCodeAt(0) - 65 + dc, row = Number(m[2]) - 1 + dr
    if (col < 0 || col > 9 || row < 0) return smartReturn('#REF!')
    const ref = String.fromCharCode(65 + col) + (row + 1)
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'INDIRECT') {
    const ref = (argsT[0] ?? '').trim()
    if (!/^[A-J]\d+$/.test(ref)) return smartReturn('#REF!')
    return smartReturn(c.evalRaw(c.cells[ref] ?? ''))
  }
  if (F === 'ADDRESS') {
    const r = Number(argsT[0]), col = Number(argsT[1])
    if (!Number.isFinite(r) || !Number.isFinite(col) || col < 1 || col > 26) return smartReturn('#VALUE!')
    return smartReturn(String.fromCharCode(64 + col) + r)
  }
  if (F === 'XLOOKUP') return smartReturn(xlookup(argsT[0], argsT[1], argsT[2], argsT[3], c.cells, c.evalRaw))
  if (F === 'INDEX') return smartReturn(indexFn(argsT[0], Number(argsT[1]), Number(argsT[2] ?? '1'), c.cells, c.evalRaw))
  if (F === 'MATCH') return smartReturn(matchFn(argsT[0], argsT[1], c.cells, c.evalRaw))
  return '0'
}
