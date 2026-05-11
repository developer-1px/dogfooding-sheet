import { describe, it, expect } from 'vitest'
import { numericValue, isNumeric } from './numeric'

describe('numericValue', () => {
  it('plain numbers', () => {
    expect(numericValue('42')).toBe(42)
    expect(numericValue('-3.14')).toBe(-3.14)
  })
  it('strips $€₩,%, whitespace', () => {
    expect(numericValue('$1.50')).toBe(1.5)
    expect(numericValue('1,234')).toBe(1234)
    expect(numericValue('30%')).toBe(30)
    expect(numericValue('₩ 5,000')).toBe(5000)
  })
  it('non-numeric → NaN', () => {
    expect(Number.isNaN(numericValue('abc'))).toBe(true)
  })
})

describe('isNumeric', () => {
  it('true for numeric (incl. formatted)', () => {
    expect(isNumeric('42')).toBe(true)
    expect(isNumeric('$1.50')).toBe(true)
    expect(isNumeric('-3')).toBe(true)
  })
  it('false for empty / non-numeric', () => {
    expect(isNumeric('')).toBe(false)
    expect(isNumeric('hello')).toBe(false)
  })
})
