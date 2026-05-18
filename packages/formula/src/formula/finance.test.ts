import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('finance', () => {
  it('PMT / FV / PV financial functions', () => {
    // $10000 loan, 5%/yr (monthly), 12 months → ~$856.07/mo
    expect(Number(evaluateCell({}, '=PMT(0.05/12, 12, 10000)'))).toBeCloseTo(-856.07, 1)
    expect(Number(evaluateCell({}, '=FV(0.05, 10, -1000, 0)'))).toBeCloseTo(12577.89, 1)
    expect(Number(evaluateCell({}, '=PV(0.05, 10, -1000, 0)'))).toBeCloseTo(7721.73, 1)
  })

  it('EFFECT / NOMINAL round-trip', () => {
    expect(Number(evaluateCell({}, '=EFFECT(0.05, 12)'))).toBeCloseTo(0.05116, 4)
    expect(Number(evaluateCell({}, '=NOMINAL(0.05116, 12)'))).toBeCloseTo(0.05, 3)
  })

  it('IRR converges to expected rate', () => {
    const cells = { A1: '-1000', A2: '300', A3: '420', A4: '680' }
    expect(Number(evaluateCell(cells, '=IRR(A1:A4)'))).toBeCloseTo(0.1634, 3)
  })

  it('NPV discounts cashflows', () => {
    const cells = { A1: '100', A2: '200', A3: '300' }
    expect(Number(evaluateCell(cells, '=NPV(0.1, A1:A3)'))).toBeCloseTo(481.59, 1)
  })
})
