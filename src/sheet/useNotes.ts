import { useEffect } from 'react'
import type { Sheet, SheetOps } from './schema'
import { migrateLegacyKey } from '../lib/legacyMigrate'
import { upsertKey } from '../lib/dictOps'

export type NoteLookup = (k: string) => string | undefined

const LEGACY_KEY = 'spreadsheet:notes:v1'

const migrateLegacy = (notes: Record<string, string>, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(notes).length === 0, ops,
    (raw) => raw && typeof raw === 'object' && Object.keys(raw).length > 0 ? raw as Record<string, string> : undefined,
    (o, v) => o.replace('/notes', v),
  )

export function useNotes(notes: Record<string, string>, ops: SheetOps) {
  useEffect(() => { migrateLegacy(notes, ops) }, [])

  const setNote = (k: string, text: string) => {
    const trimmed = text.trim()
    upsertKey(ops, '/notes', notes, k, trimmed || undefined)
  }

  return { setNote, noteOf: (k: string) => notes[k] }
}
