import { vlookup, hlookup, xlookup, xmatch, index as indexFn, match as matchFn } from './lookup'
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
import { filterRange } from './filter'
import { dispatchRef } from './refFns'
import { argString, evalArgs, splitArgs, type Ctx } from './args'
import { parseA1, colIndex } from '../a1'
import { smartReturn, wrap } from './marker'
import { coerceNumber } from './coerce'
import { isErrorValue } from './errorValue'

export type { Ctx } from './args'
export { TM, stripText } from './marker'

const lazyArg = (args: string[], index: number, c: Ctx): string =>
  args[index] === undefined ? '' : argString(args[index], c)

const lazyReturn = (value: string): string => value === '' ? wrap('') : smartReturn(value)

function dispatchLazyLogic(F: string, rawArgs: string, c: Ctx): string | null {
  const args = splitArgs(rawArgs)

  if (F === 'IF') {
    const test = coerceNumber(lazyArg(args, 0, c))
    return lazyReturn(test ? lazyArg(args, 1, c) : lazyArg(args, 2, c))
  }

  if (F === 'IFERROR') {
    const value = lazyArg(args, 0, c)
    return lazyReturn(isErrorValue(value) ? lazyArg(args, 1, c) : value)
  }

  if (F === 'IFNA') {
    const value = lazyArg(args, 0, c)
    return lazyReturn(value === '#N/A' ? lazyArg(args, 1, c) : value)
  }

  if (F === 'CHOOSE') {
    const index = Math.floor(Number(lazyArg(args, 0, c)))
    return lazyReturn(index >= 1 && index < args.length ? lazyArg(args, index, c) : '#VALUE!')
  }

  if (F === 'IFEMPTY') {
    const value = lazyArg(args, 0, c)
    return lazyReturn(value === '' ? lazyArg(args, 1, c) : value)
  }

  if (F === 'COALESCE') {
    for (let i = 0; i < args.length; i++) {
      const value = lazyArg(args, i, c)
      if (value !== '') return lazyReturn(value)
    }
    return lazyReturn('')
  }

  if (F === 'IFS') {
    for (let i = 0; i + 1 < args.length; i += 2) {
      if (coerceNumber(lazyArg(args, i, c))) return lazyReturn(lazyArg(args, i + 1, c))
    }
    return lazyReturn('#N/A')
  }

  if (F === 'SWITCH') {
    const expr = lazyArg(args, 0, c)
    for (let i = 1; i + 1 < args.length; i += 2) {
      if (lazyArg(args, i, c) === expr) return lazyReturn(lazyArg(args, i + 1, c))
    }
    return lazyReturn((args.length - 1) % 2 === 1 ? lazyArg(args, args.length - 1, c) : '#N/A')
  }

  return null
}

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

  const lazy = dispatchLazyLogic(F, rawArgs, c)
  if (lazy !== null) return lazy

  const argsT = evalArgs(rawArgs, c)

  if (F === 'COUNTIF') return smartReturn(String(countif(argsT[0], argsT[1], c.evalCell)))
  if (F === 'SUMIF') return smartReturn(String(sumif(argsT[0], argsT[1], argsT[2], c.evalCell)))
  if (F === 'COUNTA') return smartReturn(String(counta(argsT[0], c.evalCell)))
  if (F === 'COUNTBLANK') return smartReturn(String(countblank(argsT[0], c.evalCell)))
  if (F === 'COUNTUNIQUE') return smartReturn(String(countunique(argsT[0], c.evalCell)))
  if (F === 'AVERAGEIF') return smartReturn(String(averageif(argsT[0], argsT[1], argsT[2], c.evalCell)))
  if (F === 'COUNTIFS') return smartReturn(String(countifs(argsT, c.evalCell)))
  if (F === 'SUMIFS') return smartReturn(String(sumifs(argsT, c.evalCell)))
  if (F === 'AVERAGEIFS') return smartReturn(String(averageifs(argsT, c.evalCell)))
  if (F === 'MINIFS' || F === 'MAXIFS') return smartReturn(String(minMaxIf(F === 'MINIFS' ? 'MIN' : 'MAX', argsT[0], argsT[1], argsT[2], c.evalCell)))
  if (F === 'WEIGHTAVG') { const a = splitArgs(rawArgs); return smartReturn(weightAvg(a[0], a[1], c.numFromCell)) }
  if (F === 'MAX_BY' || F === 'MIN_BY') { const a = splitArgs(rawArgs); return smartReturn(maxMinBy(F, a[0], a[1], c.cells, c.evalCell, c.numFromCell)) }
  if (F === 'MOSTCOMMON' || F === 'LEASTCOMMON') return smartReturn(freqStat(F, splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'RANGEJSON') return smartReturn(rangeJSON(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'RANGESORT' || F === 'SORT') return smartReturn(rangeSort(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'RANGEUNIQUE' || F === 'UNIQUE') return smartReturn(rangeUnique(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'ENTROPY') return smartReturn(entropy(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'JACCARD') { const a = splitArgs(rawArgs); return smartReturn(jaccard(a[0], a[1], c.cells, c.evalCell)) }
  if (F === 'RANGECSV') return smartReturn(rangeCsv(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'COUNTNUMERIC') return smartReturn(countNumeric(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'RANGEHASH') return smartReturn(rangeHash(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'MAXSTR' || F === 'MINSTR') return smartReturn(strStat(F, splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'MAXLEN' || F === 'MINLEN') return smartReturn(lenStat(F, splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'FIRST' || F === 'LAST') return smartReturn(firstLast(F, splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'ARRAYTOTEXT') { const a = splitArgs(rawArgs); return smartReturn(arrayToText(a[0], argsT[1] ?? ', ', c.cells, c.evalCell)) }
  if (F === 'SAMPLE') return smartReturn(sample(splitArgs(rawArgs)[0], c.cells, c.evalCell))
  if (F === 'FILTER') { const a = splitArgs(rawArgs); return smartReturn(filterRange(a[0], a[1], c.cells, c.evalCell)) }
  if (F === 'SUMPRODUCT') return smartReturn(sumproduct(splitArgs(rawArgs), c.numFromCell))
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

  if (F === 'VLOOKUP') return smartReturn(vlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalCell, splitArgs(rawArgs)[3]))
  if (F === 'HLOOKUP') return smartReturn(hlookup(argsT[0], argsT[1], Number(argsT[2]), c.cells, c.evalCell, splitArgs(rawArgs)[3]))
  const ref = dispatchRef(F, argsT, rawArgs, c); if (ref !== null) return ref
  if (F === 'XLOOKUP') return smartReturn(xlookup(argsT[0], argsT[1], argsT[2], argsT[3], c.cells, c.evalCell, Number(argsT[4] ?? '0'), Number(argsT[5] ?? '1')))
  if (F === 'XMATCH') return smartReturn(xmatch(argsT[0], argsT[1], c.cells, c.evalCell, Number(argsT[2] ?? '0'), Number(argsT[3] ?? '1')))
  if (F === 'INDEX') return smartReturn(indexFn(argsT[0], Number(argsT[1]), Number(argsT[2] ?? '1'), c.cells, c.evalCell))
  if (F === 'MATCH') return smartReturn(matchFn(argsT[0], argsT[1], c.cells, c.evalCell, Number(argsT[2] ?? '1')))
  if (F === 'INRANGE') return matchFn(argsT[0], argsT[1], c.cells, c.evalCell, 0) === '#N/A' ? '0' : '1'
  return '0'
}
