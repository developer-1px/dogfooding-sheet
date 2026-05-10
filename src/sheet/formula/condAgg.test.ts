import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

const c = { A1: '5', A2: '10', A3: '3', A4: '20', A5: '8', A6: '' }

describe('COUNTIF', () => {
  it('counts numeric matches', () => {
    expect(evaluateCell(c, '=COUNTIF(A1:A5, ">5")')).toBe('3')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "<=5")')).toBe('2')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "10")')).toBe('1')
    expect(evaluateCell(c, '=COUNTIF(A1:A5, "<>10")')).toBe('4')
  })
})

describe('SUMIF', () => {
  it('sums values matching criteria', () => {
    expect(evaluateCell(c, '=SUMIF(A1:A5, ">5")')).toBe('38')
  })
  it('uses separate sumRange when given', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '1', B2: '10', B3: '100' }
    expect(evaluateCell(cells, '=SUMIF(A1:A3, "x", B1:B3)')).toBe('101')
  })
})

describe('COUNTA', () => {
  it('counts non-empty cells', () => {
    expect(evaluateCell(c, '=COUNTA(A1:A6)')).toBe('5')
  })
})

describe('extra math', () => {
  it('INT truncates', () => {
    expect(evaluateCell({}, '=INT(3.7)')).toBe('3')
    expect(evaluateCell({}, '=INT(-3.7)')).toBe('-3')
  })
  it('LN / LOG / EXP', () => {
    expect(Number(evaluateCell({}, '=EXP(1)'))).toBeCloseTo(Math.E, 10)
    expect(Number(evaluateCell({}, '=LN(EXP(2))'))).toBeCloseTo(2, 10)
    expect(evaluateCell({}, '=LOG(100)')).toBe('2')
    expect(evaluateCell({}, '=LOG(8, 2)')).toBe('3')
  })
  it('ROUNDUP / ROUNDDOWN', () => {
    expect(evaluateCell({}, '=ROUNDUP(3.14, 1)')).toBe('3.2')
    expect(evaluateCell({}, '=ROUNDDOWN(3.99, 0)')).toBe('3')
  })
})
