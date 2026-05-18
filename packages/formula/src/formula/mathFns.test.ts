import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('math functions', () => {
  it('GCD / LCM', () => {
    expect(evaluateCell({}, '=GCD(12,18)')).toBe('6')
    expect(evaluateCell({}, '=LCM(4,6)')).toBe('12')
    expect(evaluateCell({}, '=GCD(24,36,60)')).toBe('12')
  })

  it('EXP10 / EXP2 / EXPM1 / LOG1P', () => {
    expect(evaluateCell({}, '=EXP10(3)')).toBe('1000')
    expect(evaluateCell({}, '=EXP2(8)')).toBe('256')
    expect(Number(evaluateCell({}, '=EXPM1(1)'))).toBeCloseTo(Math.E - 1, 6)
    expect(Number(evaluateCell({}, '=LOG1P(0)'))).toBe(0)
  })

  it('CBRT cube root', () => {
    expect(evaluateCell({}, '=CBRT(27)')).toBe('3')
  })

  it('HYPOT computes Euclidean magnitude', () => {
    expect(evaluateCell({}, '=HYPOT(3, 4)')).toBe('5')
    expect(evaluateCell({}, '=HYPOT(2, 3, 6)')).toBe('7')
  })

  it('MAPRANGE remaps value', () => {
    expect(evaluateCell({}, '=MAPRANGE(5, 0, 10, 0, 100)')).toBe('50')
    expect(evaluateCell({}, '=MAPRANGE(5, 0, 0, 0, 100)')).toBe('#DIV/0!')
  })

  it('LERP / CLAMP', () => {
    expect(evaluateCell({}, '=LERP(0, 10, 0.25)')).toBe('2.5')
    expect(evaluateCell({}, '=INVLERP(2.5, 0, 10)')).toBe('0.25')
    expect(evaluateCell({}, '=MEDIAN3(7, 3, 5)')).toBe('5')
    expect(evaluateCell({}, '=CLAMP(15, 0, 10)')).toBe('10')
    expect(evaluateCell({}, '=CLAMP(-5, 0, 10)')).toBe('0')
    expect(evaluateCell({}, '=CLAMP(5, 0, 10)')).toBe('5')
  })

  it('RAND / RANDBETWEEN range', () => {
    const r = Number(evaluateCell({}, '=RAND()'))
    expect(r).toBeGreaterThanOrEqual(0); expect(r).toBeLessThan(1)
    const n = Number(evaluateCell({}, '=RANDBETWEEN(5,10)'))
    expect(n).toBeGreaterThanOrEqual(5); expect(n).toBeLessThanOrEqual(10)
    const f = Number(evaluateCell({}, '=RANDFLOAT(0,1)'))
    expect(f).toBeGreaterThanOrEqual(0); expect(f).toBeLessThan(1)
    expect(['0', '1']).toContain(evaluateCell({}, '=COINFLIP()'))
    const x = Number(evaluateCell({}, '=RANDNORM(100, 5)'))
    expect(Number.isFinite(x)).toBe(true)
  })

  it('TRUNC / SIGN / PI / EVEN / ODD', () => {
    expect(evaluateCell({}, '=TRUNC(3.789, 1)')).toBe('3.7')
    expect(evaluateCell({}, '=SIGN(-5)')).toBe('-1')
    expect(evaluateCell({}, '=SIGNCHAR(5)')).toBe('+')
    expect(evaluateCell({}, '=SIGNCHAR(-5)')).toBe('-')
    expect(evaluateCell({}, '=SIGNCHAR(0)')).toBe('0')
    expect(evaluateCell({}, '=ROUND(PI(), 4)')).toBe('3.1416')
    expect(evaluateCell({}, '=ROUND(TAU(), 4)')).toBe('6.2832')
    expect(evaluateCell({}, '=ROUND(E(), 4)')).toBe('2.7183')
    expect(evaluateCell({}, '=ROUND(LOGISTIC(0), 4)')).toBe('0.5')
    expect(evaluateCell({}, '=RELU(-3)')).toBe('0')
    expect(evaluateCell({}, '=RELU(5)')).toBe('5')
    expect(evaluateCell({}, '=EVEN(3)')).toBe('4')
    expect(evaluateCell({}, '=ODD(4)')).toBe('5')
  })

  it('FLOOR / CEILING with significance', () => {
    expect(evaluateCell({}, '=FLOOR(13, 5)')).toBe('10')
    expect(evaluateCell({}, '=CEILING(13, 5)')).toBe('15')
    expect(evaluateCell({}, '=FLOOR(13)')).toBe('13')
  })

  it('RANDPICK chooses one literal arg', () => {
    const r = evaluateCell({}, '=RANDPICK("red","green","blue")')
    expect(['red', 'green', 'blue']).toContain(r)
  })

  it('UUID returns v4 format', () => {
    expect(evaluateCell({}, '=UUID()')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('DIGITSUM', () => {
    expect(evaluateCell({}, '=DIGITSUM(123)')).toBe('6')
    expect(evaluateCell({}, '=DIGITSUM(9999)')).toBe('36')
  })

  it('ISPRIME predicate', () => {
    expect(evaluateCell({}, '=ISPRIME(7)')).toBe('1')
    expect(evaluateCell({}, '=ISPRIME(9)')).toBe('0')
    expect(evaluateCell({}, '=ISPRIME(2)')).toBe('1')
    expect(evaluateCell({}, '=ISPRIME(1)')).toBe('0')
  })

  it('RANDID generates alphanumeric of given length', () => {
    expect(evaluateCell({}, '=RANDID(12)')).toMatch(/^[A-Za-z0-9]{12}$/)
    expect(evaluateCell({}, '=RANDID()')).toMatch(/^[A-Za-z0-9]{8}$/)
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
    expect(evaluateCell({}, '=OCT2DEC("17")')).toBe('15')
    expect(evaluateCell({}, '=DEC2OCT(15)')).toBe('17')
    expect(evaluateCell({}, '=BIN2HEX("1111")')).toBe('F')
    expect(evaluateCell({}, '=HEX2BIN("F")')).toBe('1111')
    expect(evaluateCell({}, '=OCT2BIN("17")')).toBe('1111')
    expect(evaluateCell({}, '=OCT2HEX("17")')).toBe('F')
    expect(evaluateCell({}, '=BIN2OCT("1111")')).toBe('17')
    expect(evaluateCell({}, '=HEX2OCT("F")')).toBe('17')
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

  it('MAGNITUDE returns order of magnitude', () => {
    expect(evaluateCell({}, '=MAGNITUDE(1234)')).toBe('3')
    expect(evaluateCell({}, '=MAGNITUDE(0.05)')).toBe('-2')
    expect(evaluateCell({}, '=MAGNITUDE(0)')).toBe('0')
  })

  it('LOG10 / LOG2', () => {
    expect(evaluateCell({}, '=LOG10(1000)')).toBe('3')
    expect(evaluateCell({}, '=LOG2(8)')).toBe('3')
  })

  it('hyperbolic: SINH/COSH/TANH + ASINH', () => {
    expect(Number(evaluateCell({}, '=SINH(0)'))).toBe(0)
    expect(Number(evaluateCell({}, '=COSH(0)'))).toBe(1)
    expect(Number(evaluateCell({}, '=TANH(0)'))).toBe(0)
    expect(evaluateCell({}, '=ROUND(ASINH(SINH(2)),4)')).toBe('2')
  })

  it('reciprocal trig: SEC/CSC/COT + hyperbolic SECH/CSCH/COTH', () => {
    expect(evaluateCell({}, '=ROUND(SEC(0),4)')).toBe('1')
    expect(evaluateCell({}, '=ROUND(CSC(RADIANS(30)),4)')).toBe('2')
    expect(evaluateCell({}, '=ROUND(COT(RADIANS(45)),4)')).toBe('1')
    expect(evaluateCell({}, '=ROUND(SECH(0),4)')).toBe('1')
    expect(Number(evaluateCell({}, '=CSCH(1)'))).toBeCloseTo(0.8509, 3)
    expect(Number(evaluateCell({}, '=COTH(1)'))).toBeCloseTo(1.3130, 3)
    expect(Number(evaluateCell({}, '=ACOT(1)'))).toBeCloseTo(Math.PI / 4, 4)
    expect(Number(evaluateCell({}, '=ACOTH(2)'))).toBeCloseTo(0.5493, 3)
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
    expect(evaluateCell({}, '=VALUE("1,234.5")')).toBe('1234.5')
    expect(evaluateCell({}, '=VALUE("50%")')).toBe('0.5')
    expect(evaluateCell({}, '=N("$2.50")')).toBe('2.5')
    expect(evaluateCell({}, '=N("abc")')).toBe('0')
    expect(evaluateCell({}, '=N("7")')).toBe('7')
  })
})
