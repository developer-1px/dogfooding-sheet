import { useEffect } from 'react'
import { colIndex, parseA1, type SheetOps } from '../../../entities/Sheet/schema'
import { migrateLegacyKey } from '../../../shared/lib/legacyMigrate'
import { upsertKey, type RecordMutationCommands } from '../../../shared/lib/dictOps'
import { normalizeNoteText } from '../../../entities/CellNote/noteText'
import { isSafeCellText } from '../../../entities/CellValue/cellValue'

export type NoteLookup = (k: string) => string | undefined

const LEGACY_KEY = 'spreadsheet:notes:v1'

interface NoteBounds {
  rowCount: number
  colCount: number
}

const validNoteKey = (key: string, bounds?: NoteBounds): boolean => {
  const ref = parseA1(key)
  if (!ref) return false
  if (!bounds) return true
  const col = colIndex(ref.col)
  return ref.row >= 0 && ref.row < bounds.rowCount && col >= 0 && col < bounds.colCount
}

const normalizedNote = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const note = normalizeNoteText(value)
  return note !== '' && isSafeCellText(note) ? note : undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const coerceLegacyNotes = (raw: unknown, bounds?: NoteBounds): Record<string, string> | undefined => {
  if (!isRecord(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!validNoteKey(key, bounds)) continue
    const note = normalizedNote(value)
    if (note !== undefined) out[key] = note
  }
  return Object.keys(out).length > 0 ? out : undefined
}

const migrateLegacy = (notes: Record<string, string>, ops: SheetOps, bounds?: NoteBounds) =>
  migrateLegacyKey(LEGACY_KEY, Object.keys(notes).length === 0, ops,
    (raw) => coerceLegacyNotes(raw, bounds),
    (o, v) => o.replace('/notes', v),
  )

export function useNotes(notes: Record<string, string>, ops: SheetOps, bounds?: NoteBounds, commands?: RecordMutationCommands<string>) {
  const rowCount = bounds?.rowCount
  const colCount = bounds?.colCount
  useEffect(() => {
    migrateLegacy(notes, ops, rowCount !== undefined && colCount !== undefined ? { rowCount, colCount } : undefined)
  }, [notes, ops, rowCount, colCount])

  const setNote = (k: string, text: string) => {
    if (!validNoteKey(k, bounds)) return
    upsertKey(ops, '/notes', notes, k, normalizedNote(text), undefined, commands)
  }

  return { setNote, noteOf: (k: string) => notes[k] }
}
