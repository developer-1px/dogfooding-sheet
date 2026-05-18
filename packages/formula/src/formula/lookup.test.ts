import { describe, it, expect } from 'vitest'
import { evaluateCell } from './eval'

const data = {
  A1: 'Apple', B1: '1.50',
  A2: 'Bread', B2: '2.25',
  A3: 'Milk', B3: '3.00',
}

describe('HLOOKUP', () => {
  it('finds and returns row value', () => {
    const h = { A1: 'Q1', B1: 'Q2', C1: 'Q3', A2: '10', B2: '20', C2: '30' }
    expect(evaluateCell(h, '=HLOOKUP("Q2", A1:C2, 2)')).toBe('20')
    expect(evaluateCell(h, '=HLOOKUP("Q9", A1:C2, 2, FALSE)')).toBe('#N/A')
  })

  it('uses approximate match by default', () => {
    const h = { A1: '10', B1: '20', C1: '30', A2: 'low', B2: 'mid', C2: 'high' }
    expect(evaluateCell(h, '=HLOOKUP(25, A1:C2, 2)')).toBe('mid')
    expect(evaluateCell(h, '=HLOOKUP(5, A1:C2, 2)')).toBe('#N/A')
  })
})

describe('ISFORMULA / ISREF', () => {
  it('detects formula and ref', () => {
    expect(evaluateCell({ A1: '=1+2', A2: '5' }, '=ISFORMULA(A1)')).toBe('1')
    expect(evaluateCell({ A1: '=1+2', A2: '5' }, '=ISFORMULA(A2)')).toBe('0')
    expect(evaluateCell({}, '=ISREF(B5)')).toBe('1')
    expect(evaluateCell({}, '=ISREF("hi")')).toBe('0')
  })
})

describe('RANGEDIM', () => {
  it('returns rows×cols of a range', () => {
    expect(evaluateCell({}, '=RANGEDIM(B2:D5)')).toBe('4×3')
    expect(evaluateCell({}, '=RANGEDIM(A1:A1)')).toBe('1×1')
  })
})

describe('OFFSET', () => {
  it('returns value at base + (rows, cols)', () => {
    const cells = { A1: 'a', B1: 'b', A2: 'c', B2: 'd' }
    expect(evaluateCell(cells, '=OFFSET(A1, 1, 1)')).toBe('d')
    expect(evaluateCell(cells, '=OFFSET(A1, 0, 1)')).toBe('b')
    expect(evaluateCell(cells, '=OFFSET(A1, -1, 0)')).toBe('#REF!')
  })
})

describe('INDIRECT', () => {
  it('resolves ref string to cell value', () => {
    expect(evaluateCell({ B5: 'hi' }, '=INDIRECT("B5")')).toBe('hi')
    expect(evaluateCell({ A1: '7' }, '=INDIRECT(ADDRESS(1,1))')).toBe('7')
    expect(evaluateCell({}, '=INDIRECT("nope")')).toBe('#REF!')
  })
})

describe('ADDRESS', () => {
  it('builds A1 ref from row/col', () => {
    expect(evaluateCell({}, '=ADDRESS(5, 2)')).toBe('B5')
    expect(evaluateCell({}, '=ADDRESS(1, 27)')).toBe('#VALUE!')
  })
})

describe('ROW / COLUMN', () => {
  it('return ref position', () => {
    expect(evaluateCell({}, '=ROW(B5)')).toBe('5')
    expect(evaluateCell({}, '=COLUMN(C1)')).toBe('3')
  })
})

describe('XLOOKUP', () => {
  it('vertical key with separate result column', () => {
    expect(evaluateCell(data, '=XLOOKUP("Bread", A1:A3, B1:B3)')).toBe('2.25')
  })
  it('returns ifNotFound when missing', () => {
    expect(evaluateCell(data, '=XLOOKUP("Cheese", A1:A3, B1:B3, "n/a")')).toBe('n/a')
  })
  it('horizontal lookup', () => {
    const h = { A1: 'Q1', B1: 'Q2', C1: 'Q3', A2: '10', B2: '20', C2: '30' }
    expect(evaluateCell(h, '=XLOOKUP("Q3", A1:C1, A2:C2)')).toBe('30')
  })
  it('supports next lesser and next greater match modes', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high' }
    expect(evaluateCell(table, '=XLOOKUP(25, A1:A3, B1:B3, "n/a", -1)')).toBe('mid')
    expect(evaluateCell(table, '=XLOOKUP(25, A1:A3, B1:B3, "n/a", 1)')).toBe('high')
    expect(evaluateCell(table, '=XLOOKUP(5, A1:A3, B1:B3, "n/a", -1)')).toBe('n/a')
  })
  it('supports reverse search mode', () => {
    const table = { A1: 'a', B1: '1', A2: 'b', B2: '2', A3: 'a', B3: '3' }
    expect(evaluateCell(table, '=XLOOKUP("a", A1:A3, B1:B3)')).toBe('1')
    expect(evaluateCell(table, '=XLOOKUP("a", A1:A3, B1:B3, "n/a", 0, -1)')).toBe('3')
  })
  it('supports wildcard match mode', () => {
    const table = { A1: 'apple', B1: '1', A2: 'apricot', B2: '2', A3: 'banana', B3: '3' }
    expect(evaluateCell(table, '=XLOOKUP("ap*", A1:A3, B1:B3, "n/a", 2)')).toBe('1')
    expect(evaluateCell(table, '=XLOOKUP("a????ot", A1:A3, B1:B3, "n/a", 2)')).toBe('2')
    expect(evaluateCell(table, '=XLOOKUP("ap*", A1:A3, B1:B3, "n/a", 2, -1)')).toBe('2')
  })
  it('requires compatible lookup and result ranges', () => {
    const table = { A1: 'a', A2: 'b', A3: 'c', B1: '1', B2: '2' }
    expect(evaluateCell(table, '=XLOOKUP("b", A1:A3, B1:B2)')).toBe('#VALUE!')
    expect(evaluateCell(table, '=XLOOKUP("b", A1:B2, A1:A2)')).toBe('#VALUE!')
  })
})

describe('INRANGE', () => {
  it('predicate based on MATCH', () => {
    expect(evaluateCell(data, '=INRANGE("Bread", A1:A3)')).toBe('1')
    expect(evaluateCell(data, '=INRANGE("Cheese", A1:A3)')).toBe('0')
  })
})

describe('VLOOKUP', () => {
  it('finds and returns column value', () => {
    expect(evaluateCell(data, '=VLOOKUP("Bread", A1:B3, 2)')).toBe('2.25')
  })
  it('returns #N/A on exact lookup when not found', () => {
    expect(evaluateCell(data, '=VLOOKUP("Cheese", A1:B3, 2, FALSE)')).toBe('#N/A')
  })
  it('returns #REF! when col out of range', () => {
    expect(evaluateCell(data, '=VLOOKUP("Apple", A1:B3, 5)')).toBe('#REF!')
  })
  it('uses approximate match by default', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high' }
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2)')).toBe('mid')
    expect(evaluateCell(table, '=VLOOKUP(5, A1:B3, 2)')).toBe('#N/A')
  })
  it('accepts FALSE/0 for exact match', () => {
    const table = { A1: '10', B1: 'low', A2: '20', B2: 'mid', A3: '30', B3: 'high' }
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2, FALSE)')).toBe('#N/A')
    expect(evaluateCell(table, '=VLOOKUP(25, A1:B3, 2, 0)')).toBe('#N/A')
  })
})

describe('INDEX / MATCH', () => {
  it('INDEX returns cell at offset', () => {
    expect(evaluateCell(data, '=INDEX(A1:B3, 2, 1)')).toBe('Bread')
    expect(evaluateCell(data, '=INDEX(A1:B3, 3, 2)')).toBe('3')
  })
  it('MATCH returns 1-based position', () => {
    expect(evaluateCell(data, '=MATCH("Milk", A1:A3)')).toBe('3')
  })
  it('MATCH supports exact and approximate match types', () => {
    const asc = { A1: '10', A2: '20', A3: '30' }
    const desc = { A1: '30', A2: '20', A3: '10' }
    const horizontal = { A1: '10', B1: '20', C1: '30' }
    expect(evaluateCell(asc, '=MATCH(25, A1:A3)')).toBe('2')
    expect(evaluateCell(asc, '=MATCH(25, A1:A3, 0)')).toBe('#N/A')
    expect(evaluateCell(desc, '=MATCH(25, A1:A3, -1)')).toBe('1')
    expect(evaluateCell(horizontal, '=MATCH(25, A1:C1)')).toBe('2')
  })
  it('INDEX+MATCH composes like VLOOKUP', () => {
    expect(evaluateCell(data, '=INDEX(B1:B3, MATCH("Bread", A1:A3, 0))')).toBe('2.25')
  })
})

describe('logical functions', () => {
  it('AND returns 1 only when all truthy', () => {
    expect(evaluateCell({}, '=AND(1, 2, 3)')).toBe('1')
    expect(evaluateCell({}, '=AND(1, 0, 3)')).toBe('0')
  })
  it('OR returns 1 when any truthy', () => {
    expect(evaluateCell({}, '=OR(0, 0, 1)')).toBe('1')
    expect(evaluateCell({}, '=OR(0, 0, 0)')).toBe('0')
  })
  it('NOT inverts', () => {
    expect(evaluateCell({}, '=NOT(0)')).toBe('1')
    expect(evaluateCell({}, '=NOT(1)')).toBe('0')
  })
  it('IS-predicates', () => {
    expect(evaluateCell({ A1: '' }, '=ISBLANK(A1)')).toBe('1')
    expect(evaluateCell({ A1: '5' }, '=ISNUMBER(A1)')).toBe('1')
    expect(evaluateCell({ A1: 'hi' }, '=ISTEXT(A1)')).toBe('1')
  })
})
