import { useEffect, useState } from 'react'

type Cells = Record<string, string>
export interface TabsState {
  order: string[]
  active: string
  saved: Record<string, Cells>
}

const TABS_KEY = 'spreadsheet:tabs:v1'

const loadTabs = (): TabsState => {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    if (raw) {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj?.order) && typeof obj.active === 'string' && obj.saved) return obj
    }
  } catch { /* fall through */ }
  return { order: ['Sheet1'], active: 'Sheet1', saved: {} }
}

const persist = (s: TabsState) => {
  try { localStorage.setItem(TABS_KEY, JSON.stringify(s)) } catch { /* quota */ }
}

export function useTabs(currentCells: Cells) {
  const [state, setState] = useState<TabsState>(loadTabs)

  // Continuously sync the current active sheet's cells to localStorage (no re-render)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TABS_KEY)
      const t: TabsState = raw ? JSON.parse(raw) : state
      t.saved[t.active] = currentCells
      persist(t)
    } catch { /* skip */ }
  }, [currentCells, state.active])

  return { state, setState }
}

const uniqueName = (order: string[]): string => {
  let n = order.length + 1
  while (order.includes(`Sheet${n}`)) n++
  return `Sheet${n}`
}

export function tabActions(state: TabsState, setState: (s: TabsState) => void, currentCells: Cells, replaceCells: (c: Cells) => void) {
  const snapshot = (): TabsState => ({ ...state, saved: { ...state.saved, [state.active]: currentCells } })

  const switchTab = (name: string) => {
    if (name === state.active || !state.order.includes(name)) return
    const snap = snapshot()
    setState({ ...snap, active: name })
    replaceCells(snap.saved[name] ?? {})
  }

  const addSheet = () => {
    const name = uniqueName(state.order)
    const snap = snapshot()
    setState({ order: [...snap.order, name], active: name, saved: { ...snap.saved, [name]: {} } })
    replaceCells({})
  }

  const deleteSheet = (name: string) => {
    if (state.order.length <= 1 || !state.order.includes(name)) return
    const newOrder = state.order.filter((n) => n !== name)
    const newSaved = { ...state.saved }; delete newSaved[name]
    const newActive = state.active === name ? newOrder[Math.max(0, state.order.indexOf(name) - 1)] : state.active
    const snap = snapshot()
    setState({ order: newOrder, active: newActive, saved: { ...newSaved, [state.active]: snap.saved[state.active] ?? currentCells } })
    if (state.active === name) replaceCells(state.saved[newActive] ?? {})
  }

  const renameSheet = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || state.order.includes(trimmed)) return
    const newOrder = state.order.map((n) => (n === oldName ? trimmed : n))
    const newSaved = { ...state.saved }
    newSaved[trimmed] = newSaved[oldName] ?? {}
    if (oldName !== trimmed) delete newSaved[oldName]
    setState({ order: newOrder, active: state.active === oldName ? trimmed : state.active, saved: newSaved })
  }

  const duplicateSheet = (name: string) => {
    const idx = state.order.indexOf(name)
    if (idx < 0) return
    const newName = uniqueName(state.order)
    const snap = snapshot()
    const cells = { ...(snap.saved[name] ?? {}) }
    setState({ order: [...state.order.slice(0, idx + 1), newName, ...state.order.slice(idx + 1)], active: newName, saved: { ...snap.saved, [newName]: cells } })
    replaceCells(cells)
  }

  return { switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet }
}
