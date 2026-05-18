import { vlookup, hlookup, xlookup, index as indexFn, match as matchFn } from './lookup'
import { aggregate } from './aggregates'
import { sumproduct, sample, weightAvg, arrayToText, firstLast, maxMinBy, lenStat, rangeHash, strStat, countNumeric, freqStat, rangeCsv, rangeJSON, rangeSort, rangeUnique, entropy, jaccard } from './rangeOps'
import { dispatchStat } from './statDispatch'
import { countif, sumif, counta, countblank, averageif, countunique } from './condAggregates'
import { averageifs, countifs, sumifs, minMaxIf } from './multiCriteria'
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
import { parseA1, colIndex } from '../a1'
import { smartReturn } from './marker'
import { coerceNumber } from './coerce'

export type { Ctx } from './args'
export { TM, stripText } from './marker'

export function dispatch(fn: string, rawArgs: string, c: Ctx): string {
  const F = fn.toUpperCase()

  if (F === 'ISFORMULA' || F === 'ISREF') {
    const ref = (rawArgs ?? '').trim()
    const p = parseA1(ref)
    if (!p) return F === 'ISREF' ? '0' : '#REF!'
    if (F === 'ISREF') return '1'
    return (c.cells[`${p.col}${p.row + 1}`] ?? '').startsWith('=') ? '1' : '0'
  }
  if (F === 'ROW' || F === 'COLUMN') {
    const p = parseA1((rawArgs ?? '').trim())
    if (!p) return '#REF!'
    return F === 'ROW' ? String(p.row + 1) : String(colIndex(p.col) + 1)
  }

  const agg = aggregate(F, rawArgs, c)
  if (agg !== null) return agg

  const argsT = evalArgs(rawArgs, c)

  if (F === 'COUNTIF') return String(countif(argsT[0], argsT[1], c.cells, c.evalRaw))
  if (F === 'SUMIF') return String(sumif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'COUNTA') return String(counta(argsT[0], c.cells, c.evalRaw))
  if (F === 'COUNTBLANK') return String(countblank(argsT[0], c.cells, c.evalRaw))
  if (F === 'COUNTUNIQUE') return String(countunique(argsT[0], c.cells, c.evalRaw))
  if (F === 'AVERAGEIF') return smartReturn(String(averageif(argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw)))
  if (F === 'COUNTIFS') return String(countifs(argsT, c.cells, c.evalRaw))
  if (F === 'SUMIFS') return String(sumifs(argsT, c.cells, c.evalRaw))
  if (F === 'AVERAGEIFS') return smartReturn(String(averageifs(argsT, c.cells, c.evalRaw)))
  if (F === 'MINIFS' || F === 'MAXIFS') return String(minMaxIf(F === 'MINIFS' ? 'MIN' : 'MAX', argsT[0], argsT[1], argsT[2], c.cells, c.evalRaw))
  if (F === 'WEIGHTAVG') { const a = splitArgs(rawArgs); return smartReturn(weightAvg(a[0], a[1], c.numFromCell)) }
  if (F === 'MAX_BY' || F === 'MIN_BY') { const a = splitArgs(rawArgs); return smartReturn(maxMinBy(F, a[0], a[1], c.cells, c.evalRaw, c.numFromCell)) }
  if (F === 'MOSTCOMMON' || F === 'LEASTCOMMON') return smartReturn(freqStat(F, splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'RANGEJSON') return smartReturn(rangeJSON(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'RANGESORT') return smartReturn(rangeSort(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'RANGEUNIQUE') return smartReturn(rangeUnique(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'ENTROPY') return smartReturn(entropy(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'JACCARD') { const a = splitArgs(rawArgs); return smartReturn(jaccard(a[0], a[1], c.cells, c.evalRaw)) }
  if (F === 'RANGECSV') return smartReturn(rangeCsv(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'COUNTNUMERIC') return countNumeric(splitArgs(rawArgs)[0], c.cells, c.evalRaw)
  if (F === 'RANGEHASH') return smartReturn(rangeHash(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'MAXSTR' || F === 'MINSTR') return smartReturn(strStat(F, splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'MAXLEN' || F === 'MINLEN') return String(lenStat(F, splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'FIRST' || F === 'LAST') return smartReturn(firstLast(F, splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'ARRAYTOTEXT') { const a = splitArgs(rawArgs); return smartReturn(arrayToText(a[0], argsT[1] ?? ', ', c.cells, c.evalRaw)) }
  if (F === 'SAMPLE') return smartReturn(sample(splitArgs(rawArgs)[0], c.cells, c.evalRaw))
  if (F === 'SUMPRODUCT') return sumproduct(splitArgs(rawArgs), c.numFromCell)
  const stat = dispatchStat(F, argsT, rawArgs, c.numFromCell); if (stat !== null) return stat

  const argsN = argsT.map(coerceNumber)

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

  if (F === 'VLOOKUP') return smartReturn(vlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw, splitArgs(rawArgs)[3]))
  if (F === 'HLOOKUP') return smartReturn(hlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalRaw, splitArgs(rawArgs)[3]))
  const ref = dispatchRef(F, argsT, rawArgs, c); if (ref !== null) return ref
  if (F === 'XLOOKUP') return smartReturn(xlookup(argsT[0], argsT[1], argsT[2], argsT[3], c.cells, c.evalRaw, Number(argsT[4] ?? '0'), Number(argsT[5] ?? '1')))
  if (F === 'INDEX') return smartReturn(indexFn(argsT[0], Number(argsT[1]), Number(argsT[2] ?? '1'), c.cells, c.evalRaw))
  if (F === 'MATCH') return smartReturn(matchFn(argsT[0], argsT[1], c.cells, c.evalRaw, Number(argsT[2] ?? '1')))
  if (F === 'INRANGE') return matchFn(argsT[0], argsT[1], c.cells, c.evalRaw, 0) === '#N/A' ? '0' : '1'
  return '0'
}
