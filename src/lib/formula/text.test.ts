import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('text functions', () => {
  it('XOR / TRUE / FALSE', () => {
    expect(evaluateCell({}, '=XOR(1,0)')).toBe('1')
    expect(evaluateCell({}, '=XOR(1,1)')).toBe('0')
    expect(evaluateCell({}, '=XOR(1,1,1)')).toBe('1')
    expect(evaluateCell({}, '=TRUE()')).toBe('1')
    expect(evaluateCell({}, '=FALSE()')).toBe('0')
  })
  it('HYPERLINK uses label when given, else URL', () => {
    expect(evaluateCell({}, '=HYPERLINK("https://example.com", "click")')).toBe('click')
    expect(evaluateCell({}, '=HYPERLINK("https://example.com")')).toBe('https://example.com')
  })
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
  it('REGEXMATCH / REGEXEXTRACT / REGEXREPLACE', () => {
    expect(evaluateCell({}, '=REGEXMATCH("foo123", "\\d+")')).toBe('1')
    expect(evaluateCell({}, '=REGEXEXTRACT("foo123bar", "\\d+")')).toBe('123')
    expect(evaluateCell({}, '=REGEXREPLACE("a1b2c3", "\\d", "X")')).toBe('aXbXcX')
  })
  it('CLEAN strips control characters', () => {
    expect(evaluateCell({}, '=CLEAN("a\x01b\x1Fc")')).toBe('abc')
  })
  it('T returns text only (empty for numbers)', () => {
    expect(evaluateCell({}, '=T("hello")')).toBe('hello')
    expect(evaluateCell({}, '=T(42)')).toBe('')
  })
  it('SUBSTITUTE replaces all occurrences', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c", "-", "/")')).toBe('a/b/c')
  })
  it('SUBSTITUTE with occurrence_num replaces only Nth match', () => {
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c-d", "-", "/", 2)')).toBe('a-b/c-d')
    expect(evaluateCell({}, '=SUBSTITUTE("a-b-c", "-", "/", 5)')).toBe('a-b-c')
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
  it('JOIN concatenates with separator (no empty filter)', () => {
    expect(evaluateCell({}, '=JOIN("-","a","","b")')).toBe('a--b')
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
  it('DATEDIF Y/M/D units', () => {
    expect(evaluateCell({}, '=DATEDIF("2020-01-01","2026-05-11","Y")')).toBe('6')
    expect(evaluateCell({}, '=DATEDIF("2026-01-15","2026-05-11","M")')).toBe('3')
    expect(evaluateCell({}, '=DATEDIF("2026-05-01","2026-05-11","D")')).toBe('10')
  })
  it('TIME / HOUR / MINUTE / SECOND', () => {
    expect(evaluateCell({}, '=TIME(13,5,30)')).toBe('13:05:30')
    expect(evaluateCell({}, '=HOUR("13:05:30")')).toBe('13')
    expect(evaluateCell({}, '=MINUTE("13:05:30")')).toBe('5')
    expect(evaluateCell({}, '=SECOND("13:05:30")')).toBe('30')
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
  it('ISBETWEEN inclusive by default', () => {
    expect(evaluateCell({}, '=ISBETWEEN(5, 1, 10)')).toBe('1')
    expect(evaluateCell({}, '=ISBETWEEN(10, 1, 10)')).toBe('1')
    expect(evaluateCell({}, '=ISBETWEEN(10, 1, 10, 1, 0)')).toBe('0')
    expect(evaluateCell({}, '=ISBETWEEN(11, 1, 10)')).toBe('0')
  })
  it('ISERROR / ISEVEN / ISODD predicates', () => {
    expect(evaluateCell({}, '=ISERROR(VLOOKUP("z","A1:B1",2))')).toBe('1')
    expect(evaluateCell({}, '=ISERROR(5)')).toBe('0')
    expect(evaluateCell({}, '=ISEVEN(4)')).toBe('1')
    expect(evaluateCell({}, '=ISODD(3)')).toBe('1')
  })
  it('TEXT formats with thousands separators / decimals / percent', () => {
    expect(evaluateCell({}, '=TEXT(1234.5, "0,000.00")')).toBe('1,234.50')
    expect(evaluateCell({}, '=TEXT(0.25, "0%")')).toBe('25%')
    expect(evaluateCell({}, '=TEXT(7, "0.000")')).toBe('7.000')
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
  it('UNICHAR / UNICODE handle codepoints', () => {
    expect(evaluateCell({}, '=UNICHAR(128512)')).toBe('😀')
    expect(evaluateCell({}, '=UNICODE("😀")')).toBe('128512')
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
  it('PMT / FV / PV financial functions', () => {
    // $10000 loan, 5%/yr (monthly), 12 months → ~$856.07/mo
    expect(Number(evaluateCell({}, '=PMT(0.05/12, 12, 10000)'))).toBeCloseTo(-856.07, 1)
    expect(Number(evaluateCell({}, '=FV(0.05, 10, -1000, 0)'))).toBeCloseTo(12577.89, 1)
    expect(Number(evaluateCell({}, '=PV(0.05, 10, -1000, 0)'))).toBeCloseTo(7721.73, 1)
  })
  it('IRR converges to expected rate', () => {
    const cells = { A1: '-1000', A2: '300', A3: '420', A4: '680' }
    expect(Number(evaluateCell(cells, '=IRR(A1:A4)'))).toBeCloseTo(0.1634, 3)
  })
  it('NPV discounts cashflows', () => {
    const cells = { A1: '100', A2: '200', A3: '300' }
    expect(Number(evaluateCell(cells, '=NPV(0.1, A1:A3)'))).toBeCloseTo(481.59, 1)
  })
  it('FLOOR / CEILING with significance', () => {
    expect(evaluateCell({}, '=FLOOR(13, 5)')).toBe('10')
    expect(evaluateCell({}, '=CEILING(13, 5)')).toBe('15')
    expect(evaluateCell({}, '=FLOOR(13)')).toBe('13')
  })
  it('FACT / COMBIN / PERMUT', () => {
    expect(evaluateCell({}, '=FACT(5)')).toBe('120')
    expect(evaluateCell({}, '=FACT(0)')).toBe('1')
    expect(evaluateCell({}, '=COMBIN(5,2)')).toBe('10')
    expect(evaluateCell({}, '=PERMUT(5,2)')).toBe('20')
    expect(evaluateCell({}, '=COMBIN(2,5)')).toBe('#NUM!')
  })
  it('BASE / DECIMAL / HEX2DEC / DEC2HEX / BIN2DEC / DEC2BIN', () => {
    expect(evaluateCell({}, '=BASE(255, 16)')).toBe('FF')
    expect(evaluateCell({}, '=BASE(7, 2, 4)')).toBe('0111')
    expect(evaluateCell({}, '=DECIMAL("FF", 16)')).toBe('255')
    expect(evaluateCell({}, '=HEX2DEC("1A")')).toBe('26')
    expect(evaluateCell({}, '=DEC2HEX(26)')).toBe('1A')
    expect(evaluateCell({}, '=BIN2DEC("1010")')).toBe('10')
    expect(evaluateCell({}, '=DEC2BIN(10)')).toBe('1010')
  })
  it('ROMAN / ARABIC round-trip', () => {
    expect(evaluateCell({}, '=ROMAN(1994)')).toBe('MCMXCIV')
    expect(evaluateCell({}, '=ARABIC("MCMXCIV")')).toBe('1994')
    expect(evaluateCell({}, '=ROMAN(4000)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ARABIC("XYZ")')).toBe('#VALUE!')
  })
  it('BITAND / BITOR / BITXOR / BITLSHIFT / BITRSHIFT', () => {
    expect(evaluateCell({}, '=BITAND(12, 10)')).toBe('8')
    expect(evaluateCell({}, '=BITOR(12, 10)')).toBe('14')
    expect(evaluateCell({}, '=BITXOR(12, 10)')).toBe('6')
    expect(evaluateCell({}, '=BITLSHIFT(1, 3)')).toBe('8')
    expect(evaluateCell({}, '=BITRSHIFT(16, 2)')).toBe('4')
  })
  it('MROUND / QUOTIENT / SQRTPI', () => {
    expect(evaluateCell({}, '=MROUND(17, 5)')).toBe('15')
    expect(evaluateCell({}, '=MROUND(18, 5)')).toBe('20')
    expect(evaluateCell({}, '=QUOTIENT(17, 5)')).toBe('3')
    expect(evaluateCell({}, '=QUOTIENT(5, 0)')).toBe('#DIV/0!')
    expect(evaluateCell({}, '=ROUND(SQRTPI(1), 4)')).toBe('1.7725')
  })
  it('hyperbolic: SINH/COSH/TANH + ASINH', () => {
    expect(Number(evaluateCell({}, '=SINH(0)'))).toBe(0)
    expect(Number(evaluateCell({}, '=COSH(0)'))).toBe(1)
    expect(Number(evaluateCell({}, '=TANH(0)'))).toBe(0)
    expect(evaluateCell({}, '=ROUND(ASINH(SINH(2)),4)')).toBe('2')
  })
  it('trig: SIN/COS/TAN + DEGREES/RADIANS', () => {
    expect(evaluateCell({}, '=ROUND(SIN(RADIANS(30)),4)')).toBe('0.5')
    expect(evaluateCell({}, '=ROUND(COS(0),4)')).toBe('1')
    expect(evaluateCell({}, '=ROUND(DEGREES(PI()),4)')).toBe('180')
    expect(evaluateCell({}, '=ROUND(ATAN2(1,1)*4/PI(),4)')).toBe('1')
  })
  it('NUMBERVALUE parses with custom separators', () => {
    expect(evaluateCell({}, '=NUMBERVALUE("1.234,5", ",", ".")')).toBe('1234.5')
    expect(evaluateCell({}, '=NUMBERVALUE("1,234.5")')).toBe('1234.5')
    expect(evaluateCell({}, '=NUMBERVALUE("xx")')).toBe('#VALUE!')
  })
  it('VALUE / N coerce to number', () => {
    expect(evaluateCell({}, '=VALUE("3.14")')).toBe('3.14')
    expect(evaluateCell({}, '=N("abc")')).toBe('0')
    expect(evaluateCell({}, '=N("7")')).toBe('7')
  })
})
