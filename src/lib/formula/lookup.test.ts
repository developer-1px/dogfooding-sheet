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
    expect(evaluateCell(h, '=HLOOKUP("Q9", A1:C2, 2)')).toBe('#N/A')
  })
})

describe('VLOOKUP', () => {
  it('finds and returns column value', () => {
    expect(evaluateCell(data, '=VLOOKUP("Bread", A1:B3, 2)')).toBe('2.25')
  })
  it('returns #N/A when not found', () => {
    expect(evaluateCell(data, '=VLOOKUP("Cheese", A1:B3, 2)')).toBe('#N/A')
  })
  it('returns #REF! when col out of range', () => {
    expect(evaluateCell(data, '=VLOOKUP("Apple", A1:B3, 5)')).toBe('#REF!')
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
  it('INDEX+MATCH composes like VLOOKUP', () => {
    expect(evaluateCell(data, '=INDEX(B1:B3, MATCH("Bread", A1:A3))')).toBe('2.25')
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
