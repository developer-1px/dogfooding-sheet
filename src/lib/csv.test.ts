import { describe, expect, it } from 'vitest'
import { exportCsv, importCsvInto, importCsvRowsInto, parseCsv } from './csv'

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('handles quoted fields with commas', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']])
  })

  it('handles escaped quotes', () => {
    expect(parseCsv('"he said ""hi""",ok')).toEqual([['he said "hi"', 'ok']])
  })

  it('handles CRLF', () => {
    expect(parseCsv('a,b\r\n1,2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('handles empty quoted fields', () => {
    expect(parseCsv('"",x')).toEqual([['', 'x']])
  })

  it('rejects unterminated quoted fields', () => {
    expect(() => parseCsv('a,"b')).toThrow('Invalid CSV')
  })

  it('parses quoted CSV fields', () => {
    expect(parseCsv('"a,b","c""d"\r\n1,2')).toEqual([
      ['a,b', 'c"d'],
      ['1', '2'],
    ])
  })

  it('materializes only requested rows and columns', () => {
    expect(parseCsv('a,b,c\n1,2,3\nx,y,z', { maxRows: 2, maxCols: 2 })).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('still rejects malformed CSV outside captured cells', () => {
    expect(() => parseCsv('a,"b"c', { maxRows: 1, maxCols: 1 })).toThrow('Invalid CSV')
    expect(() => parseCsv('a\n"unterminated', { maxRows: 1, maxCols: 1 })).toThrow('Invalid CSV')
  })
})

describe('exportCsv', () => {
  it('skips trailing empty cells', () => {
    const data: Record<string, string> = { A1: 'a', B1: 'b' }
    const csv = exportCsv((k) => data[k] ?? '', { rowCount: 20 })
    expect(csv).toBe('a,b')
  })

  it('quotes values with commas', () => {
    const data: Record<string, string> = { A1: 'a,b', B1: 'c' }
    expect(exportCsv((k) => data[k] ?? '', { rowCount: 20 })).toBe('"a,b",c')
  })

  it('returns empty string when sheet is empty', () => {
    expect(exportCsv(() => '', { rowCount: 20 })).toBe('')
  })
})

describe('importCsvInto', () => {
  it('writes parsed cells via callback', () => {
    const written: Record<string, string> = {}
    importCsvInto('a,b\n1,2', (k, v) => { written[k] = v }, { rowCount: 20 })
    expect(written).toEqual({ A1: 'a', B1: 'b', A2: '1', B2: '2' })
  })

  it('bounds direct CSV imports to the target sheet dimensions', () => {
    const written: Record<string, string> = {}
    importCsvInto('a,b,c\n1,2,3\nx,y,z', (k, v) => { written[k] = v }, { rowCount: 1, colLetters: ['A', 'B'] })
    expect(written).toEqual({ A1: 'a', B1: 'b' })
  })

  it('writes already parsed rows without reparsing', () => {
    const written: Record<string, string> = {}
    importCsvRowsInto([['a', 'b'], ['1', '2']], (k, v) => { written[k] = v }, { rowCount: 20 })
    expect(written).toEqual({ A1: 'a', B1: 'b', A2: '1', B2: '2' })
  })
})
