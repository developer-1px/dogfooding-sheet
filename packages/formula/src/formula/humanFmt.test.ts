import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('human fmt', () => {
  it('LANG / TIMEZONE return runtime info', () => {
    expect(evaluateCell({}, '=LANG()')).toMatch(/[a-z]{2}/i)
    expect(evaluateCell({}, '=TIMEZONE()').length).toBeGreaterThan(0)
  })

  it('STRINGIFY wraps as JSON', () => {
    expect(evaluateCell({}, '=STRINGIFY("hi")')).toBe('"hi"')
    expect(evaluateCell({}, '=STRINGIFY("a","b")')).toBe('["a","b"]')
  })

  it('STRINGIFY rejects oversized generated text', () => {
    expect(evaluateCell({ A1: 'x'.repeat(10_000) }, '=STRINGIFY(A1)')).toBe('#VALUE!')
  })

  it('STARS / PROGRESSBAR', () => {
    expect(evaluateCell({}, '=STARS(3)')).toBe('★★★☆☆')
    expect(evaluateCell({}, '=STARS(0)')).toBe('☆☆☆☆☆')
    expect(evaluateCell({}, '=PROGRESSBAR(50, 4)')).toBe('██░░')
    expect(evaluateCell({}, '=PROGRESSBAR(50, 1000000000)')).toBe('#VALUE!')
  })

  it('KORNUM formats with 만/억/조', () => {
    expect(evaluateCell({}, '=KORNUM(1234)')).toBe('1,234')
    expect(evaluateCell({}, '=KORNUM(12345)')).toBe('1만 2,345')
    expect(evaluateCell({}, '=KORNUM(100000000)')).toBe('1억')
  })

  it('RELATIVETIME shows Korean relative phrase', () => {
    expect(evaluateCell({}, '=RELATIVETIME(EPOCH() - 30)')).toBe('방금')
    expect(evaluateCell({}, '=RELATIVETIME(EPOCH() - 600)')).toBe('10분 전')
    expect(evaluateCell({}, '=RELATIVETIME(EPOCH() + 3600)')).toBe('1시간 후')
  })

  it('FORMATDURATION human readable', () => {
    expect(evaluateCell({}, '=FORMATDURATION(45)')).toBe('45s')
    expect(evaluateCell({}, '=FORMATDURATION(125)')).toBe('2m 5s')
    expect(evaluateCell({}, '=FORMATDURATION(3725)')).toBe('1h 2m 5s')
  })

  it('FORMATBYTES picks unit', () => {
    expect(evaluateCell({}, '=FORMATBYTES(500)')).toBe('500 B')
    expect(evaluateCell({}, '=FORMATBYTES(1536)')).toBe('1.50 KB')
    expect(evaluateCell({}, '=FORMATBYTES(1048576)')).toBe('1.00 MB')
  })
})
