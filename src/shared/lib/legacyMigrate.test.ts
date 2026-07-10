import { describe, expect, it, vi } from 'vitest'
import type { KeyValueStorage } from './browserStorage'
import { migrateLegacyKey } from './legacyMigrate'

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

describe('migrateLegacyKey', () => {
  it('skips storage reads when the destination is not empty', () => {
    const storage: KeyValueStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    const ops = { replace: vi.fn() }

    migrateLegacyKey('legacy', false, ops, (raw) => raw, (o, value) => o.replace('/data', value), storage)

    expect(storage.getItem).not.toHaveBeenCalled()
    expect(ops.replace).not.toHaveBeenCalled()
  })

  it('loads valid legacy JSON and removes the old key', () => {
    const { storage, values } = memoryStorage({ legacy: '{"A1":"note"}' })
    const ops = { replace: vi.fn() }

    migrateLegacyKey(
      'legacy',
      true,
      ops,
      (raw) => raw && typeof raw === 'object' ? raw as Record<string, string> : undefined,
      (o, value) => o.replace('/notes', value),
      storage,
    )

    expect(ops.replace).toHaveBeenCalledWith('/notes', { A1: 'note' })
    expect(values.has('legacy')).toBe(false)
  })

  it('drops unrecognized legacy data after parsing without loading it', () => {
    const { storage, values } = memoryStorage({ legacy: '[]' })
    const ops = { replace: vi.fn() }

    migrateLegacyKey(
      'legacy',
      true,
      ops,
      (raw) => raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, string> : undefined,
      (o, value) => o.replace('/notes', value),
      storage,
    )

    expect(ops.replace).not.toHaveBeenCalled()
    expect(values.has('legacy')).toBe(false)
  })
})
