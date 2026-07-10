import type { AutoSaveSnapshot } from '@zod-crud/autosave'

export type SheetPersistenceStatus = 'pending' | 'saving' | 'saved' | 'error'

export interface SheetPersistenceState {
  status: SheetPersistenceStatus
  dirty: boolean
  savedAt: string | null
  error: string | null
}

export const initialPersistenceState: SheetPersistenceState = {
  status: 'saved',
  dirty: false,
  savedAt: null,
  error: null,
}

const persistenceErrorMessage = (error: unknown): string | null => {
  if (error == null) return null
  return error instanceof Error ? error.message : String(error)
}

export const persistenceFromAutoSave = (snapshot: AutoSaveSnapshot): SheetPersistenceState => ({
  status: snapshot.state === 'error'
    ? 'error'
    : snapshot.saving
      ? 'saving'
      : snapshot.pending
        ? 'pending'
        : 'saved',
  dirty: snapshot.pending || snapshot.saving || snapshot.state === 'error',
  savedAt: snapshot.lastSavedAt,
  error: persistenceErrorMessage(snapshot.error),
})
