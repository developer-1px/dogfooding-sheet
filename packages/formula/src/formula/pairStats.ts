import type { NumFromCell } from './args'
import { collectRefs } from './parse'

const valueError = (): string => '#VALUE!'
const numError = (): string => '#NUM!'
const divZeroError = (): string => '#DIV/0!'

const finiteResult = (value: number): string =>
  Number.isFinite(value) ? String(value) : numError()

interface OnlinePairStats {
  n: number
  meanA: number
  meanB: number
  cov: number
  varA: number
  varB: number
}

const onlinePairStats = (aStr: string, bStr: string, numFromCell: NumFromCell): OnlinePairStats => {
  const aRefs = collectRefs(aStr)
  const bRefs = collectRefs(bStr)
  const n = Math.min(aRefs.length, bRefs.length)
  let meanA = 0
  let meanB = 0
  let cov = 0
  let varA = 0
  let varB = 0
  for (let i = 0; i < n; i++) {
    const a = numFromCell(aRefs[i])
    const b = numFromCell(bRefs[i])
    const count = i + 1
    const deltaA = a - meanA
    const deltaB = b - meanB
    meanA += deltaA / count
    meanB += deltaB / count
    cov += deltaA * (b - meanB)
    varA += deltaA * (a - meanA)
    varB += deltaB * (b - meanB)
  }
  return { n, meanA, meanB, cov, varA, varB }
}

/** FORECAST(x, known_y, known_x) — predict y for given x via linear regression. */
export function forecast(x: number, yStr: string, xStr: string, numFromCell: NumFromCell): string {
  if (!Number.isFinite(x)) return valueError()
  const { n, meanA, meanB, cov, varB } = onlinePairStats(yStr, xStr, numFromCell)
  if (n === 0) return '#N/A'
  if (varB === 0) return divZeroError()
  return finiteResult(meanA + (cov / varB) * (x - meanB))
}

type VOp = 'EUCLIDEAN' | 'MANHATTAN' | 'CHEBYSHEV' | 'COSINE' | 'DOTPROD'
/** Distance/similarity between two equal-length numeric ranges. */
export function vectorOp(F: VOp, aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const aRefs = collectRefs(aStr)
  const bRefs = collectRefs(bStr)
  const n = Math.min(aRefs.length, bRefs.length)
  if (n === 0) return '#N/A'
  let sq = 0, ab = 0, mx = 0, na = 0, nb = 0, dot = 0
  for (let i = 0; i < n; i++) {
    const a = numFromCell(aRefs[i])
    const b = numFromCell(bRefs[i])
    const d = a - b, ad = Math.abs(d)
    sq += d * d; ab += ad; if (ad > mx) mx = ad
    na += a * a; nb += b * b; dot += a * b
  }
  if (F === 'EUCLIDEAN') return finiteResult(Math.sqrt(sq))
  if (F === 'MANHATTAN') return finiteResult(ab)
  if (F === 'CHEBYSHEV') return finiteResult(mx)
  if (F === 'DOTPROD') return finiteResult(dot)
  return na === 0 || nb === 0 ? divZeroError() : finiteResult(dot / Math.sqrt(na * nb))
}

type PairSum = 'SUMXMY2' | 'SUMX2MY2' | 'SUMX2PY2'
/** Pairwise sums across two equal-length ranges. */
export function pairSum(F: PairSum, aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const aRefs = collectRefs(aStr)
  const bRefs = collectRefs(bStr)
  const n = Math.min(aRefs.length, bRefs.length)
  let s = 0
  for (let i = 0; i < n; i++) {
    const x = numFromCell(aRefs[i]), y = numFromCell(bRefs[i])
    if (F === 'SUMXMY2') { const d = x - y; s += d * d }
    else if (F === 'SUMX2MY2') s += x * x - y * y
    else s += x * x + y * y
  }
  return finiteResult(s)
}

/** Paired stats: COVAR, CORREL, RSQ, SLOPE (y on x), INTERCEPT (y on x). */
export function pairStat(F: 'COVAR' | 'CORREL' | 'RSQ' | 'SLOPE' | 'INTERCEPT', aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const { n, meanA, meanB, cov, varA, varB } = onlinePairStats(aStr, bStr, numFromCell)
  if (n === 0) return '#NUM!'
  if (F === 'COVAR') return finiteResult(cov / n)
  if (F === 'SLOPE') return varB === 0 ? divZeroError() : finiteResult(cov / varB)
  if (F === 'INTERCEPT') return varB === 0 ? divZeroError() : finiteResult(meanA - (cov / varB) * meanB)
  if (varA === 0 || varB === 0) return divZeroError()
  const r = cov / Math.sqrt(varA * varB)
  return finiteResult(F === 'RSQ' ? r * r : r)
}
