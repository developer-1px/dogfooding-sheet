import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'
import { MAX_EXPANDED_REFS } from './parse'

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

  it('handles max-size NPV ranges without cashflow map arrays', () => {
    const last = `A${MAX_EXPANDED_REFS}`
    const cells = { A1: '100', A2: '200', [last]: '300' }

    expect(Number(evaluateCell(cells, `=NPV(0, A1:${last})`))).toBeCloseTo(600)
  })

  it('rejects invalid finance inputs', () => {
    const cells = { A1: '-100', A2: '120' }

    expect(evaluateCell({}, '=PMT("x", 12, 1000)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=FV(0.05, "x", -1000, 0)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=PV(0.05, 10, "x", 0)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=EFFECT(0.05, 0)')).toBe('#NUM!')
    expect(evaluateCell({}, '=EFFECT("x", 12)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=NOMINAL(0.05, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=IRR(A1:A2, "x")')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=IRR(A1:A2, -1)')).toBe('#NUM!')
    expect(evaluateCell(cells, '=NPV("x", A1:A2)')).toBe('#VALUE!')
    expect(evaluateCell(cells, '=NPV(-1, A1:A2)')).toBe('#DIV/0!')
  })
})
