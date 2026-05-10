import { describe, it, expect } from 'vitest'
import { parseCsv, exportCsv, importCsvInto } from './csv'

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
})

describe('exportCsv', () => {
  it('skips trailing empty cells', () => {
    const data: Record<string, string> = { A1: 'a', B1: 'b' }
    const csv = exportCsv((k) => data[k] ?? '')
    expect(csv).toBe('a,b')
  })
  it('quotes values with commas', () => {
    const data: Record<string, string> = { A1: 'a,b', B1: 'c' }
    expect(exportCsv((k) => data[k] ?? '')).toBe('"a,b",c')
  })
  it('returns empty string when sheet is empty', () => {
    expect(exportCsv(() => '')).toBe('')
  })
})

describe('importCsvInto', () => {
  it('writes parsed cells via callback', () => {
    const written: Record<string, string> = {}
    importCsvInto('a,b\n1,2', (k, v) => { written[k] = v })
    expect(written).toEqual({ A1: 'a', B1: 'b', A2: '1', B2: '2' })
  })
})
