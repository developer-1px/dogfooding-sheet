import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spreadsheet:notes:v1'

const load = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? obj : {}
  } catch { return {} }
}

export function useNotes() {
  const [notes, setNotes] = useState<Record<string, string>>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)) } catch { /* quota */ }
  }, [notes])

  const setNote = (k: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev }
      const trimmed = text.trim()
      if (!trimmed) delete next[k]
      else next[k] = trimmed
      return next
    })
  }

  const noteOf = (k: string): string | undefined => notes[k]

  return { notes, setNote, noteOf }
}
