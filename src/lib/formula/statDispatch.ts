import { largeSmall, rank } from './rangeOps'
import { percentile, quartile, pairStat, trimmean, forecast, percentRank, zScore, moment, gini } from './stats'
import { vectorOp } from './pairStats'
import { splitArgs } from './args'
import { smartReturn } from './marker'

type NumFromCell = (ref: string) => number

export function dispatchStat(F: string, argsT: string[], rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F === 'COVAR' || F === 'CORREL' || F === 'RSQ' || F === 'SLOPE' || F === 'INTERCEPT') {
    const [a, b] = splitArgs(rawArgs)
    return smartReturn(pairStat(F, a, b, numFromCell))
  }
  if (F === 'EUCLIDEAN' || F === 'MANHATTAN' || F === 'CHEBYSHEV' || F === 'COSINE' || F === 'DOTPROD') {
    const [a, b] = splitArgs(rawArgs)
    return smartReturn(vectorOp(F, a, b, numFromCell))
  }
  if (F === 'LARGE' || F === 'SMALL') return smartReturn(largeSmall(F, splitArgs(rawArgs)[0], Number(argsT[1]), numFromCell))
  if (F === 'FORECAST') { const a = splitArgs(rawArgs); return smartReturn(forecast(Number(argsT[0]), a[1], a[2], numFromCell)) }
  if (F === 'TRIMMEAN') return smartReturn(trimmean(splitArgs(rawArgs)[0], Number(argsT[1]), numFromCell))
  if (F === 'GINI') return smartReturn(gini(splitArgs(rawArgs)[0], numFromCell))
  if (F === 'SKEW' || F === 'KURT') return smartReturn(moment(F, splitArgs(rawArgs)[0], numFromCell))
  if (F === 'PERCENTILE') return smartReturn(percentile(splitArgs(rawArgs)[0], Number(argsT[1]), numFromCell))
  if (F === 'ZSCORE') return smartReturn(zScore(Number(argsT[0]), splitArgs(rawArgs)[1], numFromCell))
  if (F === 'PERCENTRANK') return smartReturn(percentRank(splitArgs(rawArgs)[0], Number(argsT[1]), numFromCell))
  if (F === 'QUARTILE') return smartReturn(quartile(splitArgs(rawArgs)[0], Number(argsT[1]), numFromCell))
  if (F === 'RANK') return smartReturn(rank(Number(argsT[0]), splitArgs(rawArgs)[1], Number(argsT[2] ?? '0'), numFromCell))
  return null
}
