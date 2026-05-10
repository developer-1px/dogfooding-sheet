import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'
import { refsInFormula } from './parse'

const cells = (m: Record<string, string>) => m

describe('evaluateCell', () => {
  it('returns plain values unchanged', () => {
    expect(evaluateCell({}, 'hello')).toBe('hello')
    expect(evaluateCell({}, '42')).toBe('42')
  })

  it('arithmetic with refs', () => {
    expect(evaluateCell(cells({ A1: '2', B1: '3' }), '=A1+B1')).toBe('5')
    expect(evaluateCell(cells({ A1: '10', B1: '4' }), '=A1-B1*2')).toBe('2')
  })

  it('SUM range', () => {
    expect(evaluateCell(cells({ A1: '1', A2: '2', A3: '3' }), '=SUM(A1:A3)')).toBe('6')
  })

  it('AVERAGE / MIN / MAX / COUNT', () => {
    const c = cells({ A1: '4', A2: '8', A3: '6' })
    expect(evaluateCell(c, '=AVERAGE(A1:A3)')).toBe('6')
    expect(evaluateCell(c, '=MIN(A1:A3)')).toBe('4')
    expect(evaluateCell(c, '=MAX(A1:A3)')).toBe('8')
    expect(evaluateCell(c, '=COUNT(A1:A3)')).toBe('3')
  })

  it('IF with comparison', () => {
    expect(evaluateCell(cells({ A1: '10' }), '=IF(A1>5,1,0)')).toBe('1')
    expect(evaluateCell(cells({ A1: '3' }), '=IF(A1>5,1,0)')).toBe('0')
  })

  it('ROUND', () => {
    expect(evaluateCell({}, '=ROUND(3.14159, 2)')).toBe('3.14')
  })

  it('nested function', () => {
    expect(evaluateCell(cells({ A1: '1', A2: '2', A3: '3' }), '=ROUND(SUM(A1:A3)/3, 2)')).toBe('2')
  })

  it('circular reference returns 0 fallback', () => {
    expect(evaluateCell(cells({ A1: '=A1+1' }), '=A1')).toBe('1')
  })

  it('empty refs treated as 0', () => {
    expect(evaluateCell({}, '=A1+5')).toBe('5')
  })

  it('bad expression returns #ERR', () => {
    expect(evaluateCell({}, '=alert(1)')).toBe('#ERR')
  })
})

describe('statistical functions', () => {
  const c = { A1: '2', A2: '4', A3: '4', A4: '4', A5: '5', A6: '5', A7: '7', A8: '9' }
  it('MEDIAN of odd-length list', () => {
    expect(evaluateCell({ A1: '1', A2: '3', A3: '5' }, '=MEDIAN(A1:A3)')).toBe('3')
  })
  it('MEDIAN of even-length list', () => {
    expect(evaluateCell({ A1: '1', A2: '2', A3: '3', A4: '4' }, '=MEDIAN(A1:A4)')).toBe('2.5')
  })
  it('VAR returns sample variance (n-1)', () => {
    expect(Number(evaluateCell(c, '=VAR(A1:A8)'))).toBeCloseTo(32 / 7, 4)
  })
  it('STDEV is sqrt of sample variance', () => {
    expect(Number(evaluateCell(c, '=STDEV(A1:A8)'))).toBeCloseTo(Math.sqrt(32 / 7), 4)
  })
})

describe('refsInFormula', () => {
  it('extracts single refs', () => {
    expect(refsInFormula('=A1+B2')).toEqual(['A1', 'B2'])
  })
  it('expands ranges', () => {
    expect(refsInFormula('=SUM(A1:A3)')).toEqual(['A1', 'A2', 'A3'])
  })
  it('returns empty for non-formulas', () => {
    expect(refsInFormula('hello')).toEqual([])
  })
})
