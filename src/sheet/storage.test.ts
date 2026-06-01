import { describe, expect, it } from 'vitest'
import type { KeyValueStorage } from '../lib/browserStorage'
import { initialSheet } from './schema'
import { buildData, loadInitial, saveSheet, SHEET_STORAGE_KEY } from './storage'
import { MAX_CELL_TEXT_LENGTH } from './cellValue'

const memoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
      removeItem: (key: string) => { values.delete(key) },
    } satisfies KeyValueStorage,
  }
}

describe('sheet storage', () => {
  it('builds ARIA grid pattern data without an intermediate tree', () => {
    const data = buildData((key) => `v:${key}`, 1000, ['A', 'B', 'C'])

    expect(data.relations?.rowKeys?.slice(0, 4)).toEqual(['header', 'r0', 'r1', 'r2'])
    expect(data.relations?.rowKeys?.at(-1)).toBe('r999')
    expect(data.relations?.columnKeys).toEqual(['c-A', 'c-B', 'c-C'])
    expect(data.relations?.cells?.slice(0, 3)).toEqual([
      { rowKey: 'header', columnKey: 'c-A', cellKey: 'h-A' },
      { rowKey: 'header', columnKey: 'c-B', cellKey: 'h-B' },
      { rowKey: 'header', columnKey: 'c-C', cellKey: 'h-C' },
    ])
    expect(data.items['h-A']).toEqual({ label: 'A', kind: 'columnheader' })
    expect(data.items.r999).toEqual({ label: '1000', kind: 'row' })
    expect(data.items['r999-C']).toEqual({ label: 'v:C1000', kind: 'gridcell' })
    expect(data.state?.valueByKey?.['r999-C']).toBe('v:C1000')
    expect(Object.keys(data.items)).toHaveLength(4007)
  })

  it('loads a valid persisted sheet', () => {
    const saved = { ...initialSheet, cells: { A1: 'Saved' } }
    const { storage } = memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify(saved) })

    expect(loadInitial(storage).cells.A1).toBe('Saved')
  })

  it('drops oversized persisted cells while preserving the rest of the sheet', () => {
    const saved = { ...initialSheet, cells: { A1: 'Saved', B1: 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1) } }
    const { storage } = memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify(saved) })

    expect(loadInitial(storage).cells).toEqual({ A1: 'Saved' })
  })

  it('loads valid cells when persisted ancillary state is malformed', () => {
    const saved = {
      ...initialSheet,
      cells: { A1: 'Saved', B1: 42 },
      hidden: { rows: 'bad', cols: ['A'] },
      styles: { A1: { b: true }, B1: 'bad' },
    }
    const { storage } = memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify(saved) })

    const loaded = loadInitial(storage)

    expect(loaded.cells).toEqual({ A1: 'Saved' })
    expect(loaded.hidden).toEqual({ rows: [], cols: ['A'] })
    expect(loaded.styles).toEqual({ A1: { b: true } })
  })

  it('falls back to the initial sheet for missing, malformed, or invalid persisted data', () => {
    expect(loadInitial(null)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({ [SHEET_STORAGE_KEY]: '{' }).storage)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify({ ...initialSheet, rowCount: 0 }) }).storage)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({
      [SHEET_STORAGE_KEY]: JSON.stringify({ ...initialSheet, tabs: { ...initialSheet.tabs, order: [], active: 'Sheet1' } }),
    }).storage)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({
      [SHEET_STORAGE_KEY]: JSON.stringify({ ...initialSheet, tabs: { ...initialSheet.tabs, order: ['Sheet1', 'Sheet2'], active: 'Sheet1', saved: {} } }),
    }).storage)).toEqual(initialSheet)
  })

  it('saves best effort without throwing on quota failures', () => {
    const { storage, values } = memoryStorage()
    saveSheet(initialSheet, storage)
    expect(JSON.parse(values.get(SHEET_STORAGE_KEY) ?? '{}').value).toEqual(initialSheet)

    const failing: KeyValueStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
      removeItem: () => {},
    }
    expect(() => saveSheet(initialSheet, failing)).not.toThrow()
  })
})
