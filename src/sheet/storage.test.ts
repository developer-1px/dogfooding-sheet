import { describe, expect, it } from 'vitest'
import type { KeyValueStorage } from '../lib/browserStorage'
import { initialSheet } from './schema'
import { loadInitial, saveSheet, SHEET_STORAGE_KEY } from './storage'

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
  it('loads a valid persisted sheet', () => {
    const saved = { ...initialSheet, cells: { A1: 'Saved' } }
    const { storage } = memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify(saved) })

    expect(loadInitial(storage).cells.A1).toBe('Saved')
  })

  it('falls back to the initial sheet for missing, malformed, or invalid persisted data', () => {
    expect(loadInitial(null)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({ [SHEET_STORAGE_KEY]: '{' }).storage)).toEqual(initialSheet)
    expect(loadInitial(memoryStorage({ [SHEET_STORAGE_KEY]: JSON.stringify({ ...initialSheet, rowCount: 0 }) }).storage)).toEqual(initialSheet)
  })

  it('saves best effort without throwing on quota failures', () => {
    const { storage, values } = memoryStorage()
    saveSheet(initialSheet, storage)
    expect(JSON.parse(values.get(SHEET_STORAGE_KEY) ?? '{}')).toEqual(initialSheet)

    const failing: KeyValueStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
      removeItem: () => {},
    }
    expect(() => saveSheet(initialSheet, failing)).not.toThrow()
  })
})
