import { describe, expect, it } from 'vitest'
import { stringifyJsonBounded } from './jsonStringify'

describe('stringifyJsonBounded', () => {
  it('matches JSON.stringify for supported compact JSON values', () => {
    const value = {
      text: 'a"b',
      finite: 1.5,
      notFinite: Number.NaN,
      nested: ['x', undefined, { keep: true, drop: undefined }],
    }

    expect(stringifyJsonBounded(value)).toBe(JSON.stringify(value))
  })

  it('supports pretty indentation', () => {
    const value = { cells: { A1: 'ok' } }

    expect(stringifyJsonBounded(value, { space: 2 })).toBe(JSON.stringify(value, null, 2))
  })

  it('returns null instead of materializing beyond the length limit', () => {
    expect(stringifyJsonBounded({ A1: 'abcdef' }, { maxLength: 12 })).toBeNull()
    expect(stringifyJsonBounded({ A1: 'abcdef' }, { maxLength: 15 })).toBe('{"A1":"abcdef"}')
  })

  it('returns null for root values JSON.stringify cannot serialize', () => {
    expect(stringifyJsonBounded(undefined)).toBeNull()
    expect(stringifyJsonBounded({ value: BigInt(1) })).toBeNull()
  })
})
