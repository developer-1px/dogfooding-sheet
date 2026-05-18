import { describe, it, expect } from 'vitest'
import { evaluateCell } from '@spredsheet/formula'
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
  it('date format converts epoch seconds and ms', () => {
    expect(applyFormat('1746576000', 'date')).toBe('2025-05-07')
    expect(applyFormat('1746576000000', 'date')).toBe('2025-05-07')
  })
  it('date format uses spreadsheet serial dates for formula results', () => {
    expect(evaluateCell({}, '=DATEVALUE("1900-01-01")')).toBe('2')
    expect(applyFormat('2', 'date')).toBe('1900-01-01')
    expect(applyFormat(evaluateCell({}, '=DATEVALUE("2026-01-01")'), 'date')).toBe('2026-01-01')
  })
  it('non-numeric values pass through', () => {
    expect(applyFormat('hello', 'currency')).toBe('hello')
    expect(applyFormat('', 'percent')).toBe('')
  })
})
