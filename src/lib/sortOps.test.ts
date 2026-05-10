import { describe, it, expect } from 'vitest'
import { sortByColumn } from './sortOps'

describe('sortByColumn', () => {
  it('preserves header row (row 0) and sorts data rows', () => {
    const cells = { A1: 'Name', A2: 'Bob', A3: 'Alice', A4: 'Carol' }
    const out = sortByColumn(cells, { col: 'A', dir: 'asc', rowCount: 4 })
    expect(out.A1).toBe('Name')
    expect(out.A2).toBe('Alice')
    expect(out.A3).toBe('Bob')
    expect(out.A4).toBe('Carol')
  })

  it('sorts numerically when both values are numbers', () => {
    const cells = { A1: 'n', A2: '10', A3: '2', A4: '30' }
    const out = sortByColumn(cells, { col: 'A', dir: 'asc', rowCount: 4 })
    expect([out.A2, out.A3, out.A4]).toEqual(['2', '10', '30'])
  })

  it('descending reverses order', () => {
    const cells = { A1: 'h', A2: '1', A3: '2', A4: '3' }
    const out = sortByColumn(cells, { col: 'A', dir: 'desc', rowCount: 4 })
    expect([out.A2, out.A3, out.A4]).toEqual(['3', '2', '1'])
  })

  it('keeps row contents together when sorting by a column', () => {
    const cells = { A1: 'k', B1: 'v', A2: 'b', B2: '2', A3: 'a', B3: '1' }
    const out = sortByColumn(cells, { col: 'A', dir: 'asc', rowCount: 4 })
    expect(out.A2).toBe('a'); expect(out.B2).toBe('1')
    expect(out.A3).toBe('b'); expect(out.B3).toBe('2')
  })

  it('empty values sort to the end', () => {
    const cells = { A1: 'h', A2: 'b', A4: 'a' }
    const out = sortByColumn(cells, { col: 'A', dir: 'asc', rowCount: 4 })
    expect(out.A2).toBe('a')
    expect(out.A3).toBe('b')
    expect(out.A4).toBeUndefined()
  })
})
