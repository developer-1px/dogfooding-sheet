import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

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
  it('SUBSTITUTE replaces all occurrences', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c", "-", "/")')).toBe('a/b/c')
  })
  it('FIND returns 1-based position (case-sensitive)', () => {
    expect(evaluateCell({}, '=FIND("b", "abc")')).toBe('2')
    expect(evaluateCell({}, '=FIND("X", "abc")')).toBe('#VALUE!')
  })
  it('SEARCH is case-insensitive', () => {
    expect(evaluateCell({}, '=SEARCH("B", "abc")')).toBe('2')
  })
  it('REPT repeats text', () => {
    expect(evaluateCell({}, '=REPT("ab", 3)')).toBe('ababab')
  })
  it('PROPER capitalises each word', () => {
    expect(evaluateCell({}, '=PROPER("hello world")')).toBe('Hello World')
  })
  it('nested CONCAT + UPPER', () => {
    expect(evaluateCell({ A1: 'foo' }, '=CONCAT(UPPER(A1), "!")')).toBe('FOO!')
  })
  it('TEXTJOIN ignores empty by default', () => {
    expect(evaluateCell({}, '=TEXTJOIN("-",1,"a","","b","c")')).toBe('a-b-c')
    expect(evaluateCell({}, '=TEXTJOIN("-",0,"a","","b")')).toBe('a--b')
  })
  it('EXACT case-sensitive', () => {
    expect(evaluateCell({}, '=EXACT("ab","AB")')).toBe('0')
    expect(evaluateCell({}, '=EXACT("ab","ab")')).toBe('1')
  })
  it('REPLACE by position', () => {
    expect(evaluateCell({}, '=REPLACE("abcdef",2,3,"XY")')).toBe('aXYef')
  })
  it('IFS picks first true branch', () => {
    expect(evaluateCell({ A1: '5' }, '=IFS(A1>10,"big",A1>3,"mid",1,"small")')).toBe('mid')
  })
  it('SWITCH matches by equality', () => {
    expect(evaluateCell({}, '=SWITCH("b","a",1,"b",2,"c",3,99)')).toBe('2')
    expect(evaluateCell({}, '=SWITCH("z","a",1,"b",2,99)')).toBe('99')
  })
  it('WEEKDAY returns day index', () => {
    expect(evaluateCell({}, '=WEEKDAY("2026-05-10")')).toBe('1')
    expect(evaluateCell({}, '=WEEKDAY("2026-05-10",2)')).toBe('7')
  })
  it('EDATE shifts months', () => {
    expect(evaluateCell({}, '=EDATE("2026-01-31",1)')).toBe('2026-03-03')
  })
  it('ISERROR / ISEVEN / ISODD predicates', () => {
    expect(evaluateCell({}, '=ISERROR(VLOOKUP("z","A1:B1",2))')).toBe('1')
    expect(evaluateCell({}, '=ISERROR(5)')).toBe('0')
    expect(evaluateCell({}, '=ISEVEN(4)')).toBe('1')
    expect(evaluateCell({}, '=ISODD(3)')).toBe('1')
  })
  it('DOLLAR formats with thousands and decimals', () => {
    expect(evaluateCell({}, '=DOLLAR(1234.5)')).toBe('$1,234.50')
    expect(evaluateCell({}, '=DOLLAR(1234.5, 0)')).toBe('$1,235')
  })
  it('IFNA only replaces #N/A', () => {
    expect(evaluateCell({}, '=IFNA(VLOOKUP("z","A1:B1",2),"none")')).toBe('none')
    expect(evaluateCell({}, '=IFNA("ok","fallback")')).toBe('ok')
  })
  it('IFERROR replaces error values', () => {
    expect(evaluateCell({}, '=IFERROR(VLOOKUP("zz","A1:B3",2),"none")')).toBe('none')
    expect(evaluateCell({}, '=IFERROR("ok","fallback")')).toBe('ok')
  })
  it('CHAR / CODE round-trip', () => {
    expect(evaluateCell({}, '=CHAR(65)')).toBe('A')
    expect(evaluateCell({}, '=CODE("A")')).toBe('65')
  })
  it('GCD / LCM', () => {
    expect(evaluateCell({}, '=GCD(12,18)')).toBe('6')
    expect(evaluateCell({}, '=LCM(4,6)')).toBe('12')
    expect(evaluateCell({}, '=GCD(24,36,60)')).toBe('12')
  })
  it('RAND / RANDBETWEEN range', () => {
    const r = Number(evaluateCell({}, '=RAND()'))
    expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(1)
    const n = Number(evaluateCell({}, '=RANDBETWEEN(5,10)'))
    expect(n).toBeGreaterThanOrEqual(5); expect(n).toBeLessThanOrEqual(10)
  })
  it('TRUNC / SIGN / PI / EVEN / ODD', () => {
    expect(evaluateCell({}, '=TRUNC(3.789, 1)')).toBe('3.7')
    expect(evaluateCell({}, '=SIGN(-5)')).toBe('-1')
    expect(evaluateCell({}, '=ROUND(PI(), 4)')).toBe('3.1416')
    expect(evaluateCell({}, '=EVEN(3)')).toBe('4')
    expect(evaluateCell({}, '=ODD(4)')).toBe('5')
  })
  it('VALUE / N coerce to number', () => {
    expect(evaluateCell({}, '=VALUE("3.14")')).toBe('3.14')
    expect(evaluateCell({}, '=N("abc")')).toBe('0')
    expect(evaluateCell({}, '=N("7")')).toBe('7')
  })
})
