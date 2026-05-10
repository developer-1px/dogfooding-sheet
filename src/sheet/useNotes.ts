import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import type { Sheet } from './schema'

const LEGACY_KEY = 'spreadsheet:notes:v1'

/** One-shot migration: pull legacy localStorage notes into the SSOT doc. */
function migrateLegacy(notes: Record<string, string>, ops: JsonOps<Sheet>) {
  if (Object.keys(notes).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
      ops.replace('/notes', obj as Record<string, string>)
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

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
