import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('date functions', () => {
  it('TODAY returns YYYY-MM-DD', () => {
    expect(evaluateCell({}, '=TODAY()')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('NOW returns YYYY-MM-DD HH:MM', () => {
    expect(evaluateCell({}, '=NOW()')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  it('DATE composes ISO date', () => {
    expect(evaluateCell({}, '=DATE(2026, 5, 10)')).toBe('2026-05-10')
  })

  it('DATE normalizes overflowing month and day values', () => {
    expect(evaluateCell({}, '=DATE(2026, 13, 1)')).toBe('2027-01-01')
    expect(evaluateCell({}, '=DATE(2026, 1, 32)')).toBe('2026-02-01')
  })

  it('YEAR/MONTH/DAY parse ISO date', () => {
    expect(evaluateCell({ A1: '2026-05-10' }, '=YEAR(A1)')).toBe('2026')
    expect(evaluateCell({ A1: '2026-05-10' }, '=MONTH(A1)')).toBe('5')
    expect(evaluateCell({ A1: '2026-05-10' }, '=DAY(A1)')).toBe('10')
  })

  it('YEAR/MONTH/DAY parse spreadsheet date serial numbers', () => {
    expect(evaluateCell({}, '=YEAR(DATEVALUE("2026-01-01"))')).toBe('2026')
    expect(evaluateCell({}, '=MONTH(46023)')).toBe('1')
    expect(evaluateCell({}, '=DAY(46023)')).toBe('1')
  })

  it('DAYS computes difference', () => {
    expect(evaluateCell({}, '=DAYS("2026-05-15", "2026-05-10")')).toBe('5')
    expect(evaluateCell({}, '=DAYS(DATEVALUE("2026-05-15"), DATEVALUE("2026-05-10"))')).toBe('5')
  })
})

describe('math additions', () => {
  it('POWER raises base to exponent', () => {
    expect(evaluateCell({}, '=POWER(2, 8)')).toBe('256')
  })
  it('MOD returns remainder', () => {
    expect(evaluateCell({}, '=MOD(10, 3)')).toBe('1')
  })
})
