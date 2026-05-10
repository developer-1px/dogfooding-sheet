import { describe, it, expect } from 'vitest'
import { applyFormat } from './useFormats'

describe('applyFormat', () => {
  it('plain returns value as-is', () => {
    expect(applyFormat('123', 'plain')).toBe('123')
  })
  it('currency formats USD', () => {
    expect(applyFormat('1234.5', 'currency')).toBe('$1,234.50')
  })
  it('percent multiplies by 100', () => {
    expect(applyFormat('0.25', 'percent')).toBe('25.0%')
  })
  it('integer rounds', () => {
    expect(applyFormat('3.7', 'integer')).toBe('4')
  })
  it('eur / krw format with locale symbol', () => {
    expect(applyFormat('1234', 'eur')).toContain('€')
    expect(applyFormat('1234', 'krw')).toContain('₩')
  })
  it('thousand groups digits', () => {
    expect(applyFormat('1234567', 'thousand')).toBe('1,234,567')
  })
  it('scientific uses exponential', () => {
    expect(applyFormat('12345', 'scientific')).toBe('1.23e+4')
  })
  it('non-numeric values pass through', () => {
    expect(applyFormat('hello', 'currency')).toBe('hello')
    expect(applyFormat('', 'percent')).toBe('')
  })
})
