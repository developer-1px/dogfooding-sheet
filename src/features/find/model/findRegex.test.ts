import { describe, expect, it } from 'vitest'
import { makeFindMatcher, rawCellTextJsonPath, replaceFindText } from './findRegex'

describe('find regex helpers', () => {
  it('matches literal text without compiling it as a regex', () => {
    const match = makeFindMatcher('a.b')

    expect(match('xx a.b yy')).toBe(true)
    expect(match('xx acb yy')).toBe(false)
    expect(makeFindMatcher('needle')(`${'x'.repeat(10001)}needle`)).toBe(true)
  })

  it('supports safe regex matching', () => {
    const match = makeFindMatcher('\\d+', { regex: true })

    expect(match('abc123')).toBe(true)
    expect(match('abcdef')).toBe(false)
  })

  it('rejects unsafe or invalid regex matching', () => {
    expect(makeFindMatcher('(a+)+$', { regex: true })('aaaa')).toBe(false)
    expect(makeFindMatcher('(', { regex: true })('(')).toBe(false)
  })

  it('replaces literal text case-insensitively without regex syntax', () => {
    expect(replaceFindText('Foo foo f.o', 'foo', 'bar')).toBe('bar bar f.o')
    expect(replaceFindText('a.b acb', 'a.b', 'x')).toBe('x acb')
  })

  it('replaces safe regex matches and leaves unsafe regex unchanged', () => {
    expect(replaceFindText('a1 b22', '\\d+', 'N', { regex: true })).toBe('aN bN')
    expect(replaceFindText('aaaa', '(a+)+$', 'x', { regex: true })).toBe('aaaa')
  })

  it('does not create oversized replacement text', () => {
    const replacement = 'x'.repeat(10001)

    expect(replaceFindText('a', 'a', replacement)).toBe('a')
  })

  it('builds zod-crud JSONPath only for case-sensitive raw-cell searches', () => {
    expect(rawCellTextJsonPath('a.b', { caseSensitive: true })).toBe('$.cells[?search(@, "a\\\\.b")]')
    expect(rawCellTextJsonPath('\\d+', { caseSensitive: true, regex: true })).toBe('$.cells[?search(@, "\\\\d+")]')
    expect(rawCellTextJsonPath('a.b')).toBeNull()
    expect(rawCellTextJsonPath('(', { caseSensitive: true, regex: true })).toBeNull()
  })
})
