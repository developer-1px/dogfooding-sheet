import { describe, expect, it } from 'vitest'
import type { AutoSaveSnapshot } from '@zod-crud/autosave'
import { persistenceFromAutoSave } from './sheetPersistence'

const autoSaveSnapshot = (overrides: Partial<AutoSaveSnapshot>): AutoSaveSnapshot => ({
  state: 'idle',
  pending: false,
  saving: false,
  saveCount: 0,
  sequence: 0,
  lastSavedAt: null,
  error: null,
  ...overrides,
})

describe('sheet persistence view state', () => {
  it('maps autosave pending separately from active saving', () => {
    expect(persistenceFromAutoSave(autoSaveSnapshot({
      state: 'pending',
      pending: true,
    }))).toEqual({
      status: 'pending',
      dirty: true,
      savedAt: null,
      error: null,
    })

    expect(persistenceFromAutoSave(autoSaveSnapshot({
      state: 'saving',
      pending: true,
      saving: true,
    })).status).toBe('saving')
  })
})
