import { describe, it, expect } from 'vitest'
import { matchRule, type CondRule } from './useCondFormat'

const rule = (op: CondRule['op'], value: string): CondRule => ({ col: 'A', op, value, color: '#fff' })

describe('matchRule', () => {
  it('numeric > and <', () => {
    expect(matchRule(rule('>', '10'), '15')).toBe(true)
    expect(matchRule(rule('>', '10'), '5')).toBe(false)
    expect(matchRule(rule('<', '10'), '5')).toBe(true)
  })
  it('= and != (string)', () => {
    expect(matchRule(rule('=', 'foo'), 'foo')).toBe(true)
    expect(matchRule(rule('=', 'foo'), 'bar')).toBe(false)
    expect(matchRule(rule('!=', 'foo'), 'bar')).toBe(true)
  })
  it('contains is case-insensitive', () => {
    expect(matchRule(rule('contains', 'BAR'), 'foobarbaz')).toBe(true)
    expect(matchRule(rule('contains', 'xx'), 'foobarbaz')).toBe(false)
  })
  it('numeric op on non-numeric returns false', () => {
    expect(matchRule(rule('>', '10'), 'abc')).toBe(false)
  })
})
