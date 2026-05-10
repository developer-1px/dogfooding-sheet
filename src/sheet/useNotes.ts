import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'
import { migrateLegacyKey } from './lib/legacyMigrate'

const LEGACY_KEY = 'spreadsheet:notes:v1'

const migrateLegacy = (notes: Record<string, string>, ops: JsonOps<Sheet>) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(notes).length === 0, ops,
    (raw) => raw && typeof raw === 'object' && Object.keys(raw).length > 0 ? raw as Record<string, string> : undefined,
    (o, v) => o.replace('/notes', v),
  )

export function useNotes(notes: Record<string, string>, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(notes, ops) }, [])

  const setNote = (k: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      if (notes[k] !== undefined) ops.remove(`/notes/${k}`)
      return
    }
    if (notes[k] === undefined) ops.add(`/notes/${k}`, trimmed)
    else if (notes[k] !== trimmed) ops.replace(`/notes/${k}`, trimmed)
  }

  return { setNote, noteOf: (k: string) => notes[k] }
}
