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

describe('text functions', () => {
  it('CONCAT joins strings and refs', () => {
    expect(evaluateCell({ A1: 'hello' }, '=CONCAT(A1, " ", "world")')).toBe('hello world')
  })
  it('LEN returns length', () => {
    expect(evaluateCell({ A1: 'hello' }, '=LEN(A1)')).toBe('5')
  })
  it('UPPER / LOWER', () => {
    expect(evaluateCell({}, '=UPPER("abc")')).toBe('ABC')
    expect(evaluateCell({}, '=LOWER("ABC")')).toBe('abc')
  })
  it('LEFT / RIGHT / MID', () => {
    expect(evaluateCell({}, '=LEFT("abcdef", 3)')).toBe('abc')
    expect(evaluateCell({}, '=RIGHT("abcdef", 2)')).toBe('ef')
    expect(evaluateCell({}, '=MID("abcdef", 2, 3)')).toBe('bcd')
  })
  it('TRIM removes whitespace', () => {
    expect(evaluateCell({}, '=TRIM("  hi  ")')).toBe('hi')
  })
  it('nested CONCAT + UPPER', () => {
    expect(evaluateCell({ A1: 'foo' }, '=CONCAT(UPPER(A1), "!")')).toBe('FOO!')
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
