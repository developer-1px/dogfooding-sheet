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

  it('WEEKNUM / ISOWEEKNUM', () => {
    expect(evaluateCell({}, '=WEEKNUM("2026-01-01")')).toBe('1')
    expect(evaluateCell({}, '=ISOWEEKNUM("2026-01-01")')).toBe('1')
    expect(evaluateCell({}, '=ISOWEEKNUM("2026-01-04")')).toBe('1')
  })

  it('WEEKDAY returns day index', () => {
    expect(evaluateCell({}, '=WEEKDAY("2026-05-10")')).toBe('1')
    expect(evaluateCell({}, '=WEEKDAY("2026-05-10",2)')).toBe('7')
  })

  it('EDATE shifts months', () => {
    expect(evaluateCell({}, '=EDATE("2026-01-31",1)')).toBe('2026-03-03')
  })

  it('EOMONTH returns end of month +N', () => {
    expect(evaluateCell({}, '=EOMONTH("2026-01-15",0)')).toBe('2026-01-31')
    expect(evaluateCell({}, '=EOMONTH("2026-01-15",1)')).toBe('2026-02-28')
    expect(evaluateCell({}, '=EOMONTH("2024-01-15",1)')).toBe('2024-02-29')
  })

  it('DAYS360 uses 30/360 day count', () => {
    expect(evaluateCell({}, '=DAYS360("2026-01-01","2027-01-01")')).toBe('360')
    expect(evaluateCell({}, '=DAYS360("2026-01-15","2026-02-15")')).toBe('30')
  })

  it('DATEDIF Y/M/D units', () => {
    expect(evaluateCell({}, '=DATEDIF("2020-01-01","2026-05-11","Y")')).toBe('6')
    expect(evaluateCell({}, '=DATEDIF("2026-01-15","2026-05-11","M")')).toBe('3')
    expect(evaluateCell({}, '=DATEDIF("2026-05-01","2026-05-11","D")')).toBe('10')
  })

  it('EPOCH returns Unix seconds within reasonable range', () => {
    const n = Number(evaluateCell({}, '=EPOCH()'))
    expect(n).toBeGreaterThan(1_700_000_000)
    expect(n).toBeLessThan(2_500_000_000)
  })

  it('DATEVALUE returns days since 1899-12-30 (Sheets epoch)', () => {
    expect(evaluateCell({}, '=DATEVALUE("1900-01-01")')).toBe('2')
    expect(evaluateCell({}, '=DATEVALUE("2026-01-01")')).toBe('46023')
  })

  it('TIMEVALUE returns day fraction', () => {
    expect(evaluateCell({}, '=TIMEVALUE("12:00:00")')).toBe('0.5')
    expect(evaluateCell({}, '=TIMEVALUE("06:00:00")')).toBe('0.25')
  })

  it('TIME / HOUR / MINUTE / SECOND', () => {
    expect(Number(evaluateCell({}, '=TIME(13,5,30)'))).toBeCloseTo((13 * 3600 + 5 * 60 + 30) / 86400)
    expect(Number(evaluateCell({}, '=TIME(25,0,0)'))).toBeCloseTo(1 / 24)
    expect(evaluateCell({}, '=HOUR("13:05:30")')).toBe('13')
    expect(evaluateCell({}, '=MINUTE("13:05:30")')).toBe('5')
    expect(evaluateCell({}, '=SECOND("13:05:30")')).toBe('30')
    expect(evaluateCell({}, '=HOUR(0.5)')).toBe('12')
    expect(evaluateCell({}, '=MINUTE(TIME(1, 65, 30))')).toBe('5')
    expect(evaluateCell({}, '=SECOND(TIME(1, 65, 30))')).toBe('30')
  })

  it('WORKDAY skips weekends', () => {
    // 2026-05-08 is Fri → +1 workday = Mon 2026-05-11
    expect(evaluateCell({}, '=WORKDAY("2026-05-08", 1)')).toBe('2026-05-11')
    // back 5 from Fri = previous Fri
    expect(evaluateCell({}, '=WORKDAY("2026-05-08", -5)')).toBe('2026-05-01')
  })

  it('NETWORKDAYS counts weekdays inclusive', () => {
    // 2026-05-04 (Mon) to 2026-05-08 (Fri) = 5 weekdays
    expect(evaluateCell({}, '=NETWORKDAYS("2026-05-04","2026-05-08")')).toBe('5')
    // Spans a weekend
    expect(evaluateCell({}, '=NETWORKDAYS("2026-05-04","2026-05-15")')).toBe('10')
  })

  it('rejects unsafe calendar iteration inputs', () => {
    expect(evaluateCell({}, '=WORKDAY("2026-05-08", 1.5)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=WORKDAY("2026-05-08", 10001)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=NETWORKDAYS("2026-01-01","2054-01-01")')).toBe('#VALUE!')
  })
})
