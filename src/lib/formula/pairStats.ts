import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

/** FORECAST(x, known_y, known_x) — predict y for given x via linear regression. */
export function forecast(x: number, yStr: string, xStr: string, numFromCell: NumFromCell): string {
  const Y = collectRefs(yStr).map(numFromCell)
  const X = collectRefs(xStr).map(numFromCell)
  const n = Math.min(Y.length, X.length)
  if (n === 0) return '#N/A'
  const my = Y.slice(0, n).reduce((s, v) => s + v, 0) / n
  const mx = X.slice(0, n).reduce((s, v) => s + v, 0) / n
  let cov = 0, vx = 0
  for (let i = 0; i < n; i++) { const dx = X[i] - mx; cov += dx * (Y[i] - my); vx += dx * dx }
  if (vx === 0) return '#DIV/0!'
  return String(my + (cov / vx) * (x - mx))
}

type VOp = 'EUCLIDEAN' | 'MANHATTAN' | 'CHEBYSHEV' | 'COSINE' | 'DOTPROD'
/** Distance/similarity between two equal-length numeric ranges. */
export function vectorOp(F: VOp, aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const A = collectRefs(aStr).map(numFromCell)
  const B = collectRefs(bStr).map(numFromCell)
  const n = Math.min(A.length, B.length)
  if (n === 0) return '#N/A'
  let sq = 0, ab = 0, mx = 0, na = 0, nb = 0, dot = 0
  for (let i = 0; i < n; i++) {
    const d = A[i] - B[i], ad = Math.abs(d)
    sq += d * d; ab += ad; if (ad > mx) mx = ad
    na += A[i] * A[i]; nb += B[i] * B[i]; dot += A[i] * B[i]
  }
  if (F === 'EUCLIDEAN') return String(Math.sqrt(sq))
  if (F === 'MANHATTAN') return String(ab)
  if (F === 'CHEBYSHEV') return String(mx)
  if (F === 'DOTPROD') return String(dot)
  return na === 0 || nb === 0 ? '#DIV/0!' : String(dot / Math.sqrt(na * nb))
}

/** Paired stats: COVAR, CORREL, RSQ, SLOPE (y on x), INTERCEPT (y on x). */
export function pairStat(F: 'COVAR' | 'CORREL' | 'RSQ' | 'SLOPE' | 'INTERCEPT', aStr: string, bStr: string, numFromCell: NumFromCell): string {
  const A = collectRefs(aStr).map(numFromCell)
  const B = collectRefs(bStr).map(numFromCell)
  const n = Math.min(A.length, B.length)
  if (n === 0) return '#NUM!'
  const ma = A.slice(0, n).reduce((s, x) => s + x, 0) / n
  const mb = B.slice(0, n).reduce((s, x) => s + x, 0) / n
  let cov = 0, va = 0, vb = 0
  for (let i = 0; i < n; i++) {
    const da = A[i] - ma, db = B[i] - mb
    cov += da * db; va += da * da; vb += db * db
  }
  if (F === 'COVAR') return String(cov / n)
  if (F === 'SLOPE') return vb === 0 ? '#DIV/0!' : String(cov / vb)
  if (F === 'INTERCEPT') return vb === 0 ? '#DIV/0!' : String(ma - (cov / vb) * mb)
  if (va === 0 || vb === 0) return '#DIV/0!'
  const r = cov / Math.sqrt(va * vb)
  return String(F === 'RSQ' ? r * r : r)
}
