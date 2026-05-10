import { vlookup, index as indexFn, match as matchFn } from './lookup'
import { aggregate, largeSmall } from './aggregates'
import { countif, sumif, counta, countblank, averageif } from './condAggregates'
import { dispatchDate } from './dateFns'
import { dispatchText } from './textFns'
import { dispatchMath } from './mathFns'
import { dispatchLogic } from './logicFns'
import { evalArgs, splitArgs, type Ctx } from './args'
import { smartReturn } from './marker'

export type { Ctx } from './args'
export { TM, stripText } from './marker'

export function dispatch(fn: string, rawArgs: string, c: Ctx): string {
  const F = fn.toUpperCase()

  const agg = aggregate(F, rawArgs, c.numFromCell)
  if (agg !== null) return agg

  const argsT = evalArgs(rawArgs, c)

  if (F === 'COUNTIF') return String(countif(argsT[0], argsT[1], c.cells, c.evalRaw))
  if (F === 'SUMIF') return String(sumif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'COUNTA') return String(counta(argsT[0], c.cells, c.evalRaw))
  if (F === 'COUNTBLANK') return String(countblank(argsT[0], c.cells, c.evalRaw))
  if (F === 'AVERAGEIF') return String(averageif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'LARGE' || F === 'SMALL') return smartReturn(largeSmall(F, splitArgs(rawArgs)[0], Number(argsT[1]), c.numFromCell))

  const argsN = argsT.map(Number)

  const date = dispatchDate(F, argsT); if (date !== null) return date
  const text = dispatchText(F, argsT); if (text !== null) return text
  const math = dispatchMath(F, argsT, argsN); if (math !== null) return math
  const logic = dispatchLogic(F, argsT, argsN); if (logic !== null) return logic

  if (F === 'VLOOKUP') return smartReturn(vlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw))
  if (F === 'INDEX') return smartReturn(indexFn(argsT[0], Number(argsT[1]), Number(argsT[2] ?? '1'), c.cells, c.evalRaw))
  if (F === 'MATCH') return smartReturn(matchFn(argsT[0], argsT[1], c.cells, c.evalRaw))
  return '0'
}
