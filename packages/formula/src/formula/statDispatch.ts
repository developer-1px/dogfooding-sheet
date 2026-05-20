import type { NumFromCell } from './args'
import { largeSmall, rank } from './rangeOps'
import { percentile, quartile, pairStat, trimmean, forecast, percentRank, zScore, moment, gini } from './stats'
import { vectorOp, pairSum } from './pairStats'
import { splitArgs } from './args'
import { smartReturn } from './marker'

const value = () => smartReturn('#VALUE!')

const hasArgs = (args: Array<string | undefined>, count: number): boolean =>
  args.length >= count && args.slice(0, count).every((arg) => arg !== undefined && arg.trim() !== '')

export function dispatchStat(F: string, argsT: string[], rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F === 'COVAR' || F === 'CORREL' || F === 'RSQ' || F === 'SLOPE' || F === 'INTERCEPT') {
    const [a, b] = splitArgs(rawArgs)
    if (!hasArgs([a, b], 2)) return value()
    return smartReturn(pairStat(F, a, b, numFromCell))
  }
  if (F === 'SUMXMY2' || F === 'SUMX2MY2' || F === 'SUMX2PY2') {
    const [a, b] = splitArgs(rawArgs)
    if (!hasArgs([a, b], 2)) return value()
    return smartReturn(pairSum(F, a, b, numFromCell))
  }
  if (F === 'EUCLIDEAN' || F === 'MANHATTAN' || F === 'CHEBYSHEV' || F === 'COSINE' || F === 'DOTPROD') {
    const [a, b] = splitArgs(rawArgs)
    if (!hasArgs([a, b], 2)) return value()
    return smartReturn(vectorOp(F, a, b, numFromCell))
  }
  if (F === 'LARGE' || F === 'SMALL') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(largeSmall(F, a[0], Number(argsT[1]), numFromCell)) : value()
  }
  if (F === 'FORECAST') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 3) ? smartReturn(forecast(Number(argsT[0]), a[1], a[2], numFromCell)) : value()
  }
  if (F === 'TRIMMEAN') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(trimmean(a[0], Number(argsT[1]), numFromCell)) : value()
  }
  if (F === 'GINI') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 1) ? smartReturn(gini(a[0], numFromCell)) : value()
  }
  if (F === 'SKEW' || F === 'KURT') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 1) ? smartReturn(moment(F, a[0], numFromCell)) : value()
  }
  if (F === 'PERCENTILE') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(percentile(a[0], Number(argsT[1]), numFromCell)) : value()
  }
  if (F === 'ZSCORE') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(zScore(Number(argsT[0]), a[1], numFromCell)) : value()
  }
  if (F === 'PERCENTRANK') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(percentRank(a[0], Number(argsT[1]), numFromCell)) : value()
  }
  if (F === 'QUARTILE') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(quartile(a[0], Number(argsT[1]), numFromCell)) : value()
  }
  if (F === 'RANK') {
    const a = splitArgs(rawArgs)
    return hasArgs(a, 2) ? smartReturn(rank(Number(argsT[0]), a[1], Number(argsT[2] ?? '0'), numFromCell)) : value()
  }
  return null
}
