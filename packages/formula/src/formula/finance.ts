import type { NumFromCell } from './args'
import { wrap } from './marker'
import { collectRefs } from './parse'

const valueError = (): string => wrap('#VALUE!')
const numError = (): string => wrap('#NUM!')
const divZeroError = (): string => wrap('#DIV/0!')

const hasFiniteArgs = (argsN: number[], required: number): boolean =>
  argsN.length >= required && argsN.slice(0, required).every(Number.isFinite)

const optionalFiniteArg = (argsN: number[], index: number, fallback: number): number | null => {
  const value = argsN[index]
  if (value === undefined) return fallback
  return Number.isFinite(value) ? value : null
}

const finiteResult = (value: number): string =>
  Number.isFinite(value) ? String(value) : numError()

interface CashFlows {
  values: number[]
  hasPositive: boolean
  hasNegative: boolean
}

const collectCashFlows = (rangeStr: string, numFromCell: NumFromCell): CashFlows => {
  const values: number[] = []
  let hasPositive = false
  let hasNegative = false
  for (const ref of collectRefs(rangeStr)) {
    const value = numFromCell(ref)
    values.push(value)
    if (value > 0) hasPositive = true
    if (value < 0) hasNegative = true
  }
  return { values, hasPositive, hasNegative }
}

const pmtVal = (rate: number, nper: number, pv: number, fv = 0): number => {
  if (rate === 0) return -(pv + fv) / nper
  const f = Math.pow(1 + rate, nper)
  return -(pv * f + fv) * rate / (f - 1)
}

export function dispatchFinance(F: string, argsT: string[], argsN: number[], rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F === 'EFFECT') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [r, n] = argsN
    return n < 1 ? numError() : finiteResult(Math.pow(1 + r / n, n) - 1)
  }
  if (F === 'NOMINAL') {
    if (!hasFiniteArgs(argsN, 2)) return valueError()
    const [r, n] = argsN
    return n < 1 ? numError() : finiteResult(n * (Math.pow(1 + r, 1 / n) - 1))
  }
  if (F === 'PMT') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const fv = optionalFiniteArg(argsN, 3, 0)
    return fv === null ? valueError() : finiteResult(pmtVal(argsN[0], argsN[1], argsN[2], fv))
  }
  if (F === 'FV') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const pvArg = optionalFiniteArg(argsN, 3, 0)
    if (pvArg === null) return valueError()
    const [rate, nper, pmt, pv = 0] = argsN
    const presentValue = pvArg ?? pv
    if (rate === 0) return finiteResult(-(presentValue + pmt * nper))
    const f = Math.pow(1 + rate, nper)
    return finiteResult(-(presentValue * f + pmt * (f - 1) / rate))
  }
  if (F === 'PV') {
    if (!hasFiniteArgs(argsN, 3)) return valueError()
    const fvArg = optionalFiniteArg(argsN, 3, 0)
    if (fvArg === null) return valueError()
    const [rate, nper, pmt, fv = 0] = argsN
    const futureValue = fvArg ?? fv
    if (rate === 0) return finiteResult(-(futureValue + pmt * nper))
    const f = Math.pow(1 + rate, nper)
    return finiteResult(-(futureValue + pmt * (f - 1) / rate) / f)
  }
  if (F === 'IRR') {
    const cashFlows = collectCashFlows(rawArgs.split(',')[0], numFromCell)
    const cf = cashFlows.values
    if (cf.length < 2 || !cashFlows.hasPositive || !cashFlows.hasNegative) return numError()
    const guess = argsT[1] === undefined ? 0.1 : argsN[1]
    if (!Number.isFinite(guess)) return valueError()
    if (guess <= -1) return numError()
    let r = guess
    for (let i = 0; i < 50; i++) {
      let npv = 0, dnpv = 0
      for (let t = 0; t < cf.length; t++) {
        if (r <= -1) return numError()
        const f = Math.pow(1 + r, t)
        if (!Number.isFinite(f) || f === 0) return numError()
        npv += cf[t] / f
        if (t > 0) dnpv -= t * cf[t] / (f * (1 + r))
      }
      if (!Number.isFinite(npv) || !Number.isFinite(dnpv)) return numError()
      if (Math.abs(npv) < 1e-9) return String(Math.round(r * 1e10) / 1e10)
      if (dnpv === 0) break
      const next = r - npv / dnpv
      if (!Number.isFinite(next)) return numError()
      r = next
    }
    return numError()
  }
  if (F === 'NPV') {
    if (!Number.isFinite(argsN[0])) return valueError()
    const rate = argsN[0]
    const cf = collectCashFlows(rawArgs.slice(rawArgs.indexOf(',') + 1), numFromCell).values
    if (cf.length === 0) return numError()
    let total = 0
    for (let i = 0; i < cf.length; i++) {
      const denominator = Math.pow(1 + rate, i + 1)
      if (denominator === 0) return divZeroError()
      if (!Number.isFinite(denominator)) return numError()
      total += cf[i] / denominator
      if (!Number.isFinite(total)) return numError()
    }
    return finiteResult(total)
  }
  return null
}
