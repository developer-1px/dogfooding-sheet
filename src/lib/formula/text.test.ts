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
})
