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
})
