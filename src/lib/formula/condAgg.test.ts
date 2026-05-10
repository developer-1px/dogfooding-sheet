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

describe('COUNTIFS / SUMIFS', () => {
  it('multi-criteria count and sum', () => {
    const cells = { A1: 'x', A2: 'x', A3: 'y', A4: 'x', B1: '5', B2: '15', B3: '15', B4: '20', C1: '1', C2: '2', C3: '3', C4: '4' }
    expect(evaluateCell(cells, '=COUNTIFS(A1:A4, "x", B1:B4, ">10")')).toBe('2')
    expect(evaluateCell(cells, '=SUMIFS(C1:C4, A1:A4, "x", B1:B4, ">10")')).toBe('6')
  })
})

describe('MINIFS / MAXIFS', () => {
  it('picks min/max value where criteria matches', () => {
    const cells = { A1: '5', A2: '10', A3: '3', A4: '20', B1: 'x', B2: 'y', B3: 'x', B4: 'y' }
    expect(evaluateCell(cells, '=MINIFS(A1:A4, B1:B4, "x")')).toBe('3')
    expect(evaluateCell(cells, '=MAXIFS(A1:A4, B1:B4, "y")')).toBe('20')
  })
})

describe('PERCENTILE / QUARTILE', () => {
  it('PERCENTILE interpolates', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 0)')).toBe('1')
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 0.5)')).toBe('3')
    expect(evaluateCell(cells, '=PERCENTILE(A1:A5, 1)')).toBe('5')
  })
  it('QUARTILE matches percentile mapping', () => {
    const cells = { A1: '1', A2: '2', A3: '3', A4: '4', A5: '5' }
    expect(evaluateCell(cells, '=QUARTILE(A1:A5, 2)')).toBe('3')
    expect(evaluateCell(cells, '=QUARTILE(A1:A5, 4)')).toBe('5')
  })
})

describe('SUMPRODUCT', () => {
  it('sums element-wise products across ranges', () => {
    const cells = { A1: '2', A2: '3', A3: '4', B1: '10', B2: '20', B3: '30' }
    expect(evaluateCell(cells, '=SUMPRODUCT(A1:A3, B1:B3)')).toBe('200')
  })
})

describe('COUNTUNIQUE', () => {
  it('counts distinct non-empty values', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', A4: 'z', A5: '', A6: 'y' }
    expect(evaluateCell(cells, '=COUNTUNIQUE(A1:A6)')).toBe('3')
  })
})

describe('COUNTBLANK', () => {
  it('counts empty cells', () => {
    expect(evaluateCell(c, '=COUNTBLANK(A1:A6)')).toBe('1')
  })
})

describe('AVERAGEIF', () => {
  it('averages matching values', () => {
    expect(evaluateCell(c, '=AVERAGEIF(A1:A5, ">5")')).toBeCloseTo(38 / 3, 5).toString
    const v = Number(evaluateCell(c, '=AVERAGEIF(A1:A5, ">5")'))
    expect(v).toBeCloseTo(38 / 3, 5)
  })
  it('uses separate avgRange', () => {
    const cells = { A1: 'x', A2: 'y', A3: 'x', B1: '10', B2: '99', B3: '20' }
    expect(evaluateCell(cells, '=AVERAGEIF(A1:A3, "x", B1:B3)')).toBe('15')
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
  it('VAR/VARP/STDEV/STDEVP differ by N vs N-1', () => {
    const cells = { A1: '2', A2: '4', A3: '4', A4: '4', A5: '5', A6: '5', A7: '7', A8: '9' }
    expect(Number(evaluateCell(cells, '=VARP(A1:A8)'))).toBeCloseTo(4, 5)
    expect(Number(evaluateCell(cells, '=STDEVP(A1:A8)'))).toBeCloseTo(2, 5)
  })
  it('RANK descending by default, asc when order != 0', () => {
    const cells = { A1: '5', A2: '1', A3: '8', A4: '3', A5: '9' }
    expect(evaluateCell(cells, '=RANK(8, A1:A5)')).toBe('2')
    expect(evaluateCell(cells, '=RANK(8, A1:A5, 1)')).toBe('4')
    expect(evaluateCell(cells, '=RANK(99, A1:A5)')).toBe('#N/A')
  })
  it('LARGE / SMALL pick Nth largest / smallest', () => {
    const cells = { A1: '5', A2: '1', A3: '8', A4: '3', A5: '9' }
    expect(evaluateCell(cells, '=LARGE(A1:A5,1)')).toBe('9')
    expect(evaluateCell(cells, '=LARGE(A1:A5,2)')).toBe('8')
    expect(evaluateCell(cells, '=SMALL(A1:A5,1)')).toBe('1')
    expect(evaluateCell(cells, '=SMALL(A1:A5,3)')).toBe('5')
  })
  it('PRODUCT multiplies range', () => {
    expect(evaluateCell({ A1: '2', A2: '3', A3: '4' }, '=PRODUCT(A1:A3)')).toBe('24')
  })
  it('MODE picks most common', () => {
    expect(evaluateCell({ A1: '5', A2: '3', A3: '5', A4: '2' }, '=MODE(A1:A4)')).toBe('5')
  })
  it('ROUNDUP / ROUNDDOWN', () => {
    expect(evaluateCell({}, '=ROUNDUP(3.14, 1)')).toBe('3.2')
    expect(evaluateCell({}, '=ROUNDDOWN(3.99, 0)')).toBe('3')
  })
})
