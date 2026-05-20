import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

describe('logic functions', () => {
  it('IFS picks first true branch', () => {
    expect(evaluateCell({ A1: '5' }, '=IFS(A1>10,"big",A1>3,"mid",1,"small")')).toBe('mid')
  })

  it('SWITCH matches by equality', () => {
    expect(evaluateCell({}, '=SWITCH("b","a",1,"b",2,"c",3,99)')).toBe('2')
    expect(evaluateCell({}, '=SWITCH("z","a",1,"b",2,99)')).toBe('99')
  })

  it('CHOOSE picks by 1-based index', () => {
    expect(evaluateCell({}, '=CHOOSE(2, "a", "b", "c")')).toBe('b')
    expect(evaluateCell({}, '=CHOOSE(5, "a", "b", "c")')).toBe('#VALUE!')
  })

  it('IFEMPTY / COALESCE pick first non-empty', () => {
    expect(evaluateCell({ A1: '' }, '=IFEMPTY(A1, "fallback")')).toBe('fallback')
    expect(evaluateCell({ A1: 'x' }, '=IFEMPTY(A1, "fallback")')).toBe('x')
    expect(evaluateCell({ A1: '', A2: '', A3: 'ok' }, '=COALESCE(A1, A2, A3)')).toBe('ok')
    expect(evaluateCell({}, '=COALESCE(, "fallback")')).toBe('fallback')
  })

  it('IF treats blank or omitted branches as blank', () => {
    expect(evaluateCell({}, '=IF(0,, "fallback")')).toBe('fallback')
    expect(evaluateCell({}, '=IF(0, "yes",)')).toBe('')
    expect(evaluateCell({}, '=IF(0, "yes")')).toBe('')
  })

  it('IF only evaluates the selected branch', () => {
    expect(evaluateCell({ A1: '=A1+1' }, '=IF(0,A1,"ok")')).toBe('ok')
    expect(evaluateCell({ A1: '=A1+1' }, '=IF(0,SUM(A1:A1),"ok")')).toBe('ok')
    expect(evaluateCell({}, '=IF(1,"ok",1/0)')).toBe('ok')
  })

  it('TYPE classifies values', () => {
    expect(evaluateCell({}, '=TYPE(42)')).toBe('1')
    expect(evaluateCell({}, '=TYPE("hi")')).toBe('2')
    expect(evaluateCell({}, '=TYPE(NA())')).toBe('16')
    expect(evaluateCell({}, '=TYPE(1/0)')).toBe('16')
  })

  it('logic predicates reject missing required inputs', () => {
    expect(evaluateCell({}, '=ISBLANK()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISNUMBER()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISTEXT()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISERROR()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=TYPE()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISEVEN()')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISODD()')).toBe('#VALUE!')
  })

  it('ISBETWEEN inclusive by default', () => {
    expect(evaluateCell({}, '=ISBETWEEN(5, 1, 10)')).toBe('1')
    expect(evaluateCell({}, '=ISBETWEEN(10, 1, 10)')).toBe('1')
    expect(evaluateCell({}, '=ISBETWEEN(10, 1, 10, 1, 0)')).toBe('0')
    expect(evaluateCell({}, '=ISBETWEEN(11, 1, 10)')).toBe('0')
  })

  it('ISBETWEEN rejects missing and non-numeric required inputs', () => {
    expect(evaluateCell({}, '=ISBETWEEN(5, 1)')).toBe('#VALUE!')
    expect(evaluateCell({}, '=ISBETWEEN("x", 1, 10)')).toBe('#VALUE!')
  })

  it('ISERROR / ISEVEN / ISODD predicates', () => {
    expect(evaluateCell({}, '=ISERROR(VLOOKUP("z","A1:B1",2,FALSE))')).toBe('1')
    expect(evaluateCell({}, '=ISERROR(1/0)')).toBe('1')
    expect(evaluateCell({}, '=ISERROR(5)')).toBe('0')
    expect(evaluateCell({}, '=ISEVEN(4)')).toBe('1')
    expect(evaluateCell({}, '=ISODD(3)')).toBe('1')
  })

  it('IFNA only replaces #N/A', () => {
    expect(evaluateCell({}, '=IFNA(VLOOKUP("z","A1:B1",2,FALSE),"none")')).toBe('none')
    expect(evaluateCell({}, '=IFNA("ok","fallback")')).toBe('ok')
  })

  it('IFERROR replaces error values', () => {
    expect(evaluateCell({}, '=IFERROR(VLOOKUP("zz","A1:B3",2,FALSE),"none")')).toBe('none')
    expect(evaluateCell({}, '=IFERROR(1/0,"none")')).toBe('none')
    expect(evaluateCell({}, '=IFERROR("ok","fallback")')).toBe('ok')
  })

  it('lazy condition helpers do not evaluate unused fallbacks or branches', () => {
    const cyclic = { A1: '=A1+1' }

    expect(evaluateCell(cyclic, '=IFERROR("ok",A1)')).toBe('ok')
    expect(evaluateCell(cyclic, '=IFERROR(A1,"none")')).toBe('none')
    expect(evaluateCell(cyclic, '=CHOOSE(2,A1,"ok")')).toBe('ok')
    expect(evaluateCell(cyclic, '=IFEMPTY("ok",A1)')).toBe('ok')
    expect(evaluateCell(cyclic, '=COALESCE("ok",A1)')).toBe('ok')
    expect(evaluateCell(cyclic, '=IFS(0,A1,1,"ok")')).toBe('ok')
    expect(evaluateCell(cyclic, '=SWITCH("b","a",A1,"b","ok")')).toBe('ok')
  })
})
