import { useState } from 'react'
import { parseA1 } from './schema'
import { refsInFormula } from '../lib/formula'

export function useFindState() {
  const [findOpen, setFindOpen] = useState(false)
  const [findMode, setFindMode] = useState<'find' | 'replace'>('find')
  return {
    findOpen, setFindOpen, findMode,
    openFind: () => { setFindMode('find'); setFindOpen(true) },
    openReplace: () => { setFindMode('replace'); setFindOpen(true) },
  }
}

export function highlightedIdsFor(editing: string | null, draft: string): string[] {
  if (!editing || !draft.startsWith('=')) return []
  return refsInFormula(draft)
    .map((ref) => {
      const p = parseA1(ref)
      return p ? `r${p.row}-${p.col}` : ''
    })
    .filter(Boolean)
}
