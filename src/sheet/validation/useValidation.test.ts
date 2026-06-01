import { describe, expect, it } from 'vitest'
import type { SheetOps } from '../schema'
import { coerceLegacyValidationRules, checkboxConversionPatch, normalizeCheckboxValue, setCheckboxValidationRule, setListValidationRule } from './useValidation'
import { MAX_CELL_TEXT_LENGTH } from '../cellValue'
import { MAX_VALIDATION_OPTIONS } from '../schema'

const recordingOps = () => {
  const calls: unknown[] = []
  return {
    calls,
    ops: {
      patch: (patch: never) => { calls.push(['patch', patch]) },
    } as unknown as SheetOps,
  }
}

describe('checkbox validation conversion', () => {
  it('normalizes existing values for checkbox cells', () => {
    expect(normalizeCheckboxValue(undefined)).toBe('FALSE')
    expect(normalizeCheckboxValue('')).toBe('FALSE')
    expect(normalizeCheckboxValue('1')).toBe('TRUE')
    expect(normalizeCheckboxValue('yes')).toBe('TRUE')
    expect(normalizeCheckboxValue('FALSE')).toBe('FALSE')
  })

  it('patches validation and cell values atomically', () => {
    expect(checkboxConversionPatch(
      { A1: { type: 'list', options: ['x'] }, B1: { type: 'checkbox' } },
      { A1: 'yes', B1: 'TRUE' },
      ['A1', 'B1', 'C1'],
    )).toEqual([
      { op: 'replace', path: '/validation/A1', value: { type: 'checkbox' } },
      { op: 'replace', path: '/cells/A1', value: 'TRUE' },
      { op: 'add', path: '/validation/C1', value: { type: 'checkbox' } },
      { op: 'add', path: '/cells/C1', value: 'FALSE' },
    ])
  })

  it('delegates checkbox conversion through a validation command', () => {
    const { ops, calls } = recordingOps()
    const delegated: unknown[] = []

    setCheckboxValidationRule(
      { A1: { type: 'list', options: ['x'] } },
      { A1: 'yes' },
      ops,
      ['A1', 'B1'],
      undefined,
      { applyCheckboxConversion: (next) => { delegated.push(next); return true } },
    )

    expect(delegated).toEqual([{
      validation: { A1: { type: 'checkbox' }, B1: { type: 'checkbox' } },
      cells: { A1: 'TRUE', B1: 'FALSE' },
    }])
    expect(calls).toEqual([])
  })

  it('falls back to an atomic patch when checkbox conversion delegation fails', () => {
    const { ops, calls } = recordingOps()

    setCheckboxValidationRule(
      { A1: { type: 'list', options: ['x'] } },
      { A1: 'yes' },
      ops,
      ['A1'],
      undefined,
      { applyCheckboxConversion: () => false },
    )

    expect(calls).toEqual([['patch', [
      { op: 'replace', path: '/validation/A1', value: { type: 'checkbox' } },
      { op: 'replace', path: '/cells/A1', value: 'TRUE' },
    ]]])
  })

  it('coerces legacy validation through current rule limits', () => {
    const migrated = coerceLegacyValidationRules({
      A1: { type: 'list', options: [' open ', 'open', '', 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1), 'closed'] },
      B1: { type: 'checkbox' },
      C1: { type: 'unknown' },
      C2: { type: 'list', options: [] },
      Z99: { type: 'checkbox' },
      'bad/key': { type: 'checkbox' },
    }, { rowCount: 2, colCount: 2 })

    expect(migrated).toEqual({
      A1: { type: 'list', options: ['open', 'closed'] },
      B1: { type: 'checkbox' },
    })
  })

  it('caps legacy list options', () => {
    const migrated = coerceLegacyValidationRules({
      A1: {
        type: 'list',
        options: Array.from({ length: MAX_VALIDATION_OPTIONS + 10 }, (_v, i) => `opt-${i}`),
      },
    })

    expect(migrated?.A1).toEqual({
      type: 'list',
      options: Array.from({ length: MAX_VALIDATION_OPTIONS }, (_v, i) => `opt-${i}`),
    })
  })

  it('skips list rule writes when normalized options are unchanged', () => {
    const { ops, calls } = recordingOps()

    setListValidationRule({
      A1: { type: 'list', options: ['open', 'closed'] },
      B1: { type: 'checkbox' },
    }, ops, ['A1', 'B1', 'C1'], [' open ', 'closed', 'open'], { rowCount: 1, colCount: 3 })

    expect(calls).toEqual([
      ['patch', [
        { op: 'replace', path: '/validation/B1', value: { type: 'list', options: ['open', 'closed'] } },
        { op: 'add', path: '/validation/C1', value: { type: 'list', options: ['open', 'closed'] } },
      ]],
    ])
  })
})
