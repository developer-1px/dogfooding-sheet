import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { evaluateCell, MAX_ARITHMETIC_DEPTH, MAX_FORMULA_LENGTH } from './eval'
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
    expect(evaluateCell(cells({ A1: '2', B1: '3' }), '=$A$1+B$1')).toBe('5')
    expect(evaluateCell({}, '=-(1+2)*3')).toBe('-9')
    expect(evaluateCell({}, '=1/0')).toBe('#DIV/0!')
  })

  it('coerces common formatted numbers in cell references', () => {
    expect(evaluateCell(cells({ A1: '1,234', B1: '50%', C1: '$2.50', D1: '(10)' }), '=A1+B1+C1+D1')).toBe('1227')
  })

  it('coerces checkbox boolean cell values into formulas', () => {
    expect(evaluateCell(cells({ A1: 'TRUE', A2: 'FALSE' }), '=A1+A2+1')).toBe('2')
    expect(evaluateCell(cells({ A1: 'TRUE' }), '=IF(A1, "yes", "no")')).toBe('yes')
  })

  it('SUM range', () => {
    expect(evaluateCell(cells({ A1: '1', A2: '2', A3: '3' }), '=SUM(A1:A3)')).toBe('6')
    expect(evaluateCell(cells({ A1: '1', A2: '2', A3: '3' }), '=SUM($A$1:$A$3)')).toBe('6')
    expect(evaluateCell({}, '=SUM(1,2,3)')).toBe('6')
    expect(evaluateCell(cells({ A1: '4' }), '=SUM(A1,2,3)')).toBe('9')
    expect(evaluateCell(cells({ A1: '4' }), '=SUM(A1,A1)')).toBe('8')
    expect(evaluateCell({}, '=SUM("3", TRUE, FALSE)')).toBe('4')
    expect(evaluateCell({}, '=SUM("$1,200.50", "50%")')).toBe('1201')
    expect(evaluateCell({}, '=SUM(1+2, 3*4)')).toBe('15')
    expect(evaluateCell(cells({ A1: '4' }), '=SUM(A1+1, A1*2)')).toBe('13')
    expect(evaluateCell({}, '=SUM("x", 2)')).toBe('2')
    expect(evaluateCell({}, '=SUM(1/0, 2)')).toBe('#DIV/0!')
    expect(evaluateCell(cells({ A1: '=1/0' }), '=SUM(A1, 2)')).toBe('#DIV/0!')
  })

  it('rejects oversized ranges before expanding refs', () => {
    expect(evaluateCell({}, '=SUM(A1:A26001)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=IFERROR(SUM(A1:A26001), "too-large")')).toBe('too-large')
  })

  it('AVERAGE / MIN / MAX / COUNT', () => {
    const c = cells({ A1: '4', A2: '8', A3: '6' })
    expect(evaluateCell(c, '=AVERAGE(A1:A3)')).toBe('6')
    expect(evaluateCell(c, '=MIN(A1:A3)')).toBe('4')
    expect(evaluateCell(c, '=MAX(A1:A3)')).toBe('8')
    expect(evaluateCell(c, '=COUNT(A1:A3)')).toBe('3')
    expect(evaluateCell(cells({ A1: '4' }), '=COUNT(A1,A1)')).toBe('2')
    expect(evaluateCell(c, '=AVERAGE(A1:A3, 12)')).toBe('7.5')
    expect(evaluateCell({}, '=AVERAGE(1+2, 3*4)')).toBe('7.5')
    expect(evaluateCell(cells({ A1: '4' }), '=AVERAGE(A1+2, A1*3)')).toBe('9')
    expect(evaluateCell({}, '=MIN(8, 4, 6)')).toBe('4')
    expect(evaluateCell({}, '=MAX(8, 4, 6)')).toBe('8')
    expect(evaluateCell({}, '=COUNT(8, 4, "x")')).toBe('2')
    expect(evaluateCell({}, '=COUNT("8", TRUE, "x")')).toBe('2')
    expect(evaluateCell(cells({ A1: '4', A2: 'text', A3: '8' }), '=AVERAGE(A1:A3)')).toBe('6')
    expect(evaluateCell(cells({ A1: '4', A2: 'text', A3: '8' }), '=COUNT(A1:A3)')).toBe('2')
    expect(evaluateCell(cells({ A1: '4', A2: 'text', A3: '8' }), '=MIN(A1:A3)')).toBe('4')
    expect(evaluateCell(cells({ A1: 'text', A2: '' }), '=AVERAGE(A1:A2)')).toBe('#DIV/0!')
    expect(evaluateCell(cells({ A1: 'text', A2: '' }), '=COUNT(A1:A2)')).toBe('0')
    expect(evaluateCell(cells({ A1: 'text', A2: '' }), '=MIN(A1:A2)')).toBe('#VALUE!')
  })

  it('IF with comparison', () => {
    expect(evaluateCell(cells({ A1: '10' }), '=IF(A1>5,1,0)')).toBe('1')
    expect(evaluateCell(cells({ A1: '3' }), '=IF(A1>5,1,0)')).toBe('0')
    expect(evaluateCell({}, '=1=1')).toBe('1')
    expect(evaluateCell({}, '=1<>1')).toBe('0')
    expect(evaluateCell({}, '=2>=1')).toBe('1')
  })

  it('ROUND', () => {
    expect(evaluateCell({}, '=ROUND(3.14159, 2)')).toBe('3.14')
  })

  it('nested function', () => {
    expect(evaluateCell(cells({ A1: '1', A2: '2', A3: '3' }), '=ROUND(SUM(A1:A3)/3, 2)')).toBe('2')
    expect(evaluateCell({}, '=SUM(ROUND(1.2, 0), ROUND(2.8, 0))')).toBe('4')
    expect(evaluateCell({}, '=AVERAGE(ROUND(1.2, 0), ROUND(2.8, 0))')).toBe('2')
  })

  it('returns an explicit error for circular references', () => {
    expect(evaluateCell(cells({ A1: '=A1+1' }), '=A1')).toBe('#CYCLE!')
    expect(evaluateCell(cells({ A1: '=B1+1', B1: '=A1+1' }), '=A1')).toBe('#CYCLE!')
    expect(evaluateCell(cells({ A1: '=SUM(A1:A2)', A2: '2' }), '=SUM(A1:A2)')).toBe('#CYCLE!')
  })

  it('empty refs treated as 0', () => {
    expect(evaluateCell({}, '=A1+5')).toBe('5')
  })

  it('bad expression returns #ERR', () => {
    expect(evaluateCell({}, '=alert(1)')).toBe('#ERR')
    expect(evaluateCell({}, '=1;globalThis.__formulaInjected=1')).toBe('#ERR')
    expect((globalThis as typeof globalThis & { __formulaInjected?: number }).__formulaInjected).toBeUndefined()
  })

  it('rejects evaluator resource limit inputs', () => {
    const oversizedFormula = '=' + '1+'.repeat(Math.ceil(MAX_FORMULA_LENGTH / 2)) + '1'
    const tooDeep = '=' + '('.repeat(MAX_ARITHMETIC_DEPTH + 1) + '1' + ')'.repeat(MAX_ARITHMETIC_DEPTH + 1)

    expect(evaluateCell({}, oversizedFormula)).toBe('#VALUE!')
    expect(evaluateCell({}, tooDeep)).toBe('#VALUE!')
  })

  it('does not use runtime code generation for arithmetic fallback', () => {
    const source = readFileSync(new URL('./eval.ts', import.meta.url), 'utf8')
    expect(source).not.toContain('Function(')
    expect(source).not.toContain('eval(')
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
    expect(refsInFormula('=$A$1+B$2')).toEqual(['A1', 'B2'])
  })
  it('expands ranges', () => {
    expect(refsInFormula('=SUM(A1:A3)')).toEqual(['A1', 'A2', 'A3'])
    expect(refsInFormula('=SUM($A$1:$A$3)')).toEqual(['A1', 'A2', 'A3'])
  })
  it('returns no highlights for oversized ranges', () => {
    expect(refsInFormula('=SUM(A1:A26001)')).toEqual([])
  })
  it('returns empty for non-formulas', () => {
    expect(refsInFormula('hello')).toEqual([])
  })
})
