import { vlookup, hlookup, xlookup, index as indexFn, match as matchFn } from './lookup'
import { aggregate } from './aggregates'
import { largeSmall, rank, sumproduct, sample, weightAvg } from './rangeOps'
import { percentile, quartile, pairStat, trimmean, forecast } from './stats'
import { countif, sumif, counta, countblank, averageif, countunique } from './condAggregates'
import { countifs, sumifs, minMaxIf } from './multiCriteria'
import { dispatchDate } from './dateFns'
import { dispatchTime } from './timeFns'
import { dispatchCalendar } from './calendar'
import { dispatchText } from './textFns'
import { dispatchRegex } from './regexFns'
import { dispatchTextFormat } from './textFormat'
import { dispatchMath } from './mathFns'
import { dispatchNumeric } from './numericFns'
import { dispatchFinance } from './finance'
import { dispatchLogic } from './logicFns'
import { dispatchRef } from './refFns'
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
  if (F === 'WEIGHTAVG') { const a = splitArgs(rawArgs); return smartReturn(weightAvg(a[0], a[1], c.numFromCell)) }
  if (F === 'SAMPLE') return smartReturn(sample(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'SUMPRODUCT') return sumproduct(splitArgs(rawArgs), c.numFromCell)
  if (F === 'COVAR' || F === 'CORREL' || F === 'SLOPE' || F === 'INTERCEPT') { const [a, b] = splitArgs(rawArgs); return smartReturn(pairStat(F, a, b, c.numFromCell)) }
  if (F === 'LARGE' || F === 'SMALL') return smartReturn(largeSmall(F, splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'FORECAST') { const a = splitArgs(rawArgs); return smartReturn(forecast(Number(argsT[0]), a[1], a[2], c.numFromCell)) }
  if (F === 'TRIMMEAN') return smartReturn(trimmean(splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'PERCENTILE') return smartReturn(percentile(splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'QUARTILE') return smartReturn(quartile(splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))
  if (F === 'RANK') return smartReturn(rank(Number(argsT[0]), splitArgs(rawArgs)[1], Number(argsT[2] ?? '0'), c.numFromCell))

  const argsN = argsT.map(Number)

  const date = dispatchDate(F, argsT); if (date !== null) return date
  const time = dispatchTime(F, argsT); if (time !== null) return time
  const cal = dispatchCalendar(F, argsT); if (cal !== null) return cal
  const text = dispatchText(F, argsT); if (text !== null) return text
  const rx = dispatchRegex(F, argsT); if (rx !== null) return rx
  const tf = dispatchTextFormat(F, argsT); if (tf !== null) return tf
  const math = dispatchMath(F, argsT, argsN); if (math !== null) return math
  const num = dispatchNumeric(F, argsT, argsN); if (num !== null) return num
  const fin = dispatchFinance(F, argsT, argsN, rawArgs, c.numFromCell); if (fin !== null) return fin
  const logic = dispatchLogic(F, argsT, argsN); if (logic !== null) return logic

  if (F === 'VLOOKUP') return smartReturn(vlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw))
  if (F === 'HLOOKUP') return smartReturn(hlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw))
  const ref = dispatchRef(F, argsT, rawArgs, c); if (ref !== null) return ref
  if (F === 'XLOOKUP') return smartReturn(xlookup(argsT[0], argsT[1], argsT[2], argsT[3], c.cells, c.evalRaw))
  if (F === 'INDEX') return smartReturn(indexFn(argsT[0], Number(argsT[1]), Number(argsT[2] ?? '1'), c.cells, c.evalRaw))
  if (F === 'MATCH') return smartReturn(matchFn(argsT[0], argsT[1], c.cells, c.evalRaw))
  return '0'
}
