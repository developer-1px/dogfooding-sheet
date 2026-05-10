import { collectRefs } from './parse'

type NumFromCell = (ref: string) => number

const pmtVal = (rate: number, nper: number, pv: number, fv = 0): number => {
  if (rate === 0) return -(pv + fv) / nper
  const f = Math.pow(1 + rate, nper)
  return -(pv * f + fv) * rate / (f - 1)
}

export function dispatchFinance(F: string, argsT: string[], argsN: number[], rawArgs: string, numFromCell: NumFromCell): string | null {
  if (F === 'PMT') return String(pmtVal(argsN[0], argsN[1], argsN[2], argsN[3] ?? 0))
  if (F === 'FV') {
    const [rate, nper, pmt, pv = 0] = argsN
    if (rate === 0) return String(-(pv + pmt * nper))
    const f = Math.pow(1 + rate, nper)
    return String(-(pv * f + pmt * (f - 1) / rate))
  }
  if (F === 'PV') {
    const [rate, nper, pmt, fv = 0] = argsN
    if (rate === 0) return String(-(fv + pmt * nper))
    const f = Math.pow(1 + rate, nper)
    return String(-(fv + pmt * (f - 1) / rate) / f)
  }
  if (F === 'IRR') {
    const cf = collectRefs(rawArgs.split(',')[0]).map(numFromCell)
    if (cf.length < 2) return '#NUM!'
    let r = Number(argsT[1] ?? '0.1')
    for (let i = 0; i < 50; i++) {
      let npv = 0, dnpv = 0
      for (let t = 0; t < cf.length; t++) {
        const f = Math.pow(1 + r, t)
        npv += cf[t] / f
        if (t > 0) dnpv -= t * cf[t] / (f * (1 + r))
      }
      if (Math.abs(npv) < 1e-9) return String(Math.round(r * 1e10) / 1e10)
      if (dnpv === 0) break
      r = r - npv / dnpv
    }
    return '#NUM!'
  }
  if (F === 'NPV') {
    const rate = Number(argsT[0])
    const cf = collectRefs(rawArgs.slice(rawArgs.indexOf(',') + 1)).map(numFromCell)
    let total = 0
    for (let i = 0; i < cf.length; i++) total += cf[i] / Math.pow(1 + rate, i + 1)
    return String(total)
  }
  return null
}
