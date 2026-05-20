import { describe, expect, it } from 'vitest'
import { checkboxConversionPatch, normalizeCheckboxValue } from './useValidation'

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
})
