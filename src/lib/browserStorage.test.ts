import { describe, expect, it, vi } from 'vitest'
import { readStoredJson, removeStoredKey, writeStoredJson, type KeyValueStorage } from './browserStorage'

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

describe('browserStorage', () => {
  it('reads JSON through a safe storage adapter', () => {
    const { storage } = memoryStorage({ sheet: '{"cells":{"A1":"ok"}}' })
    expect(readStoredJson('sheet', storage)).toEqual({ cells: { A1: 'ok' } })
    expect(readStoredJson('missing', storage)).toBeUndefined()
    expect(readStoredJson('sheet', null)).toBeUndefined()
  })

  it('treats invalid JSON and storage failures as unavailable data', () => {
    expect(readStoredJson('sheet', memoryStorage({ sheet: '{' }).storage)).toBeUndefined()
    const failing: KeyValueStorage = {
      getItem: () => { throw new Error('blocked') },
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    expect(readStoredJson('sheet', failing)).toBeUndefined()
  })

  it('treats oversized JSON as unavailable data', () => {
    const { storage } = memoryStorage({ sheet: '{"cells":{"A1":"large"}}' })

    expect(readStoredJson('sheet', storage, { maxLength: 10 })).toBeUndefined()
  })

  it('writes and removes best effort without surfacing quota failures', () => {
    const { storage, values } = memoryStorage()
    writeStoredJson('sheet', { cells: { A1: 'saved' } }, storage)
    expect(values.get('sheet')).toBe('{"cells":{"A1":"saved"}}')
    removeStoredKey('sheet', storage)
    expect(values.has('sheet')).toBe(false)

    const failing: KeyValueStorage = {
      getItem: vi.fn(),
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(() => writeStoredJson('sheet', {}, failing)).not.toThrow()
    expect(() => removeStoredKey('sheet', failing)).not.toThrow()
  })

  it('skips oversized JSON writes', () => {
    const { storage, values } = memoryStorage({ sheet: '{"cells":{}}' })

    writeStoredJson('sheet', { cells: { A1: 'too large' } }, storage, { maxLength: 10 })

    expect(values.get('sheet')).toBe('{"cells":{}}')
  })
})
