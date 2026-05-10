import { useState } from 'react'
import { COL_LETTERS } from './schema'
import { refsInFormula } from './formula'

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
      const m = /^([A-J])(\d+)$/.exec(ref)
      if (!m || !COL_LETTERS.includes(m[1] as (typeof COL_LETTERS)[number])) return ''
      return `r${Number(m[2]) - 1}-${m[1]}`
    })
    .filter(Boolean)
}
