import { useState } from 'react'

export function useFindState() {
  const [findOpen, setFindOpen] = useState(false)
  const [findMode, setFindMode] = useState<'find' | 'replace'>('find')
  return {
    findOpen, setFindOpen, findMode,
    openFind: () => { setFindMode('find'); setFindOpen(true) },
    openReplace: () => { setFindMode('replace'); setFindOpen(true) },
  }
}
