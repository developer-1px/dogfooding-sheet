import { describe, it, expect } from 'vitest'
import type { SheetOps } from '../schema'
import { coerceLegacyCondRules, matchRule, setCondRule, type CondRule } from './useCondFormat'

const rule = (op: CondRule['op'], value: string): CondRule => ({ col: 'A', op, value, color: '#fff' })

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      add: (path: never, value: never) => { calls.push(['add', path, value]) },
      replace: (path: never, value: never) => { calls.push(['replace', path, value]) },
    } as unknown as SheetOps,
  }
}

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

describe('coerceLegacyCondRules', () => {
  it('keeps bounded valid rules and lets later rules replace the same column', () => {
    expect(coerceLegacyCondRules([
      { col: 'A', op: '>', value: '1', color: '#fff' },
      { col: 'A', op: '<', value: '2', color: '#000' },
      { col: 'C', op: '=', value: 'x', color: '#fff' },
      { col: 'B', op: 'contains', value: 'bad color', color: 'red' },
      { col: 'B', op: '=', value: '', color: '#fff' },
      { col: 'B', op: 'contains', value: 'ok', color: '#abc' },
    ], { colCount: 2 })).toEqual([
      { col: 'A', op: '<', value: '2', color: '#000' },
      { col: 'B', op: 'contains', value: 'ok', color: '#abc' },
    ])
  })

  it('returns undefined when no legacy rule survives', () => {
    expect(coerceLegacyCondRules([{ col: 'C', op: '=', value: 'x', color: '#fff' }], { colCount: 2 })).toBeUndefined()
    expect(coerceLegacyCondRules({})).toBeUndefined()
  })
})

describe('setCondRule', () => {
  it('skips writes when the normalized rule is unchanged or invalid', () => {
    const { ops, calls } = recordingOps()
    const rules: CondRule[] = [{ col: 'A', op: '>', value: '1', color: '#fff' }]

    expect(setCondRule(rules, ops, { col: 'A', op: '>', value: '1', color: '#fff' })).toBe(false)
    expect(setCondRule(rules, ops, { col: 'C', op: '=', value: 'x', color: '#fff' }, { colCount: 2 })).toBe(false)

    expect(calls).toEqual([])
  })

  it('adds or replaces only when a rule changes', () => {
    const { ops, calls } = recordingOps()
    const rules: CondRule[] = [{ col: 'A', op: '>', value: '1', color: '#fff' }]

    expect(setCondRule(rules, ops, { col: 'A', op: '<', value: '2', color: '#000' })).toBe(true)
    expect(setCondRule(rules, ops, { col: 'B', op: 'contains', value: 'ok', color: '#abc' })).toBe(true)

    expect(calls).toEqual([
      ['replace', '/condFormat/0', { col: 'A', op: '<', value: '2', color: '#000' }],
      ['add', '/condFormat/-', { col: 'B', op: 'contains', value: 'ok', color: '#abc' }],
    ])
  })
})
