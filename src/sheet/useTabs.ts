import { useEffect } from 'react'
import type { JsonOps } from 'zod-crud'
import { blankBundle, bundleOf, withBundle, type Sheet, type TabBundle } from './schema'

type Cells = Record<string, string>
export interface TabsState {
  order: string[]
  active: string
  saved: Record<string, TabBundle>
}

const LEGACY_KEY = 'spreadsheet:tabs:v1'

function migrateLegacy(state: TabsState, ops: JsonOps<Sheet>) {
  if (state.order.length > 1 || Object.keys(state.saved).length > 0) return
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    if (Array.isArray(obj?.order) && typeof obj.active === 'string' && obj.saved) {
      const upgraded: TabsState = {
        order: obj.order, active: obj.active,
        saved: Object.fromEntries(Object.entries(obj.saved as Record<string, Cells>)
          .map(([k, cells]) => [k, { ...blankBundle(), cells }])),
      }
      ops.replace('/tabs', upgraded)
    }
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* ignore */ }
}

export function useTabs(state: TabsState, ops: JsonOps<Sheet>) {
  useEffect(() => { migrateLegacy(state, ops) }, [])
  const setState = (s: TabsState) => ops.replace('/tabs', s)
  return { state, setState }
}

const uniqueName = (order: string[]): string => {
  let n = order.length + 1
  while (order.includes(`Sheet${n}`)) n++
  return `Sheet${n}`
}

export function tabActions(sheet: Sheet, ops: JsonOps<Sheet>) {
  const state = sheet.tabs
  const snapshotSaved = (): Record<string, TabBundle> => ({ ...state.saved, [state.active]: bundleOf(sheet) })
  const setTabs = (next: TabsState) => ({ ...sheet, tabs: next })
  const hydrate = (next: Sheet, name: string, saved: Record<string, TabBundle>): Sheet =>
    withBundle({ ...next, tabs: { ...next.tabs, active: name } }, saved[name] ?? blankBundle())

  const switchTab = (name: string) => {
    if (name === state.active || !state.order.includes(name)) return
    const saved = snapshotSaved()
    ops.reset(hydrate(setTabs({ ...state, active: name, saved }), name, saved))
  }

  const addSheet = () => {
    const name = uniqueName(state.order)
    const saved = { ...snapshotSaved(), [name]: blankBundle() }
    ops.reset(hydrate(setTabs({ order: [...state.order, name], active: name, saved }), name, saved))
  }

  const deleteSheet = (name: string) => {
    if (state.order.length <= 1 || !state.order.includes(name)) return
    const newOrder = state.order.filter((n) => n !== name)
    const saved = snapshotSaved()
    delete saved[name]
    const newActive = state.active === name ? newOrder[Math.max(0, state.order.indexOf(name) - 1)] : state.active
    ops.reset(hydrate(setTabs({ order: newOrder, active: newActive, saved }), newActive, saved))
  }

  const renameSheet = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || state.order.includes(trimmed)) return
    const saved = snapshotSaved()
    saved[trimmed] = saved[oldName] ?? blankBundle()
    delete saved[oldName]
    const newOrder = state.order.map((n) => (n === oldName ? trimmed : n))
    const active = state.active === oldName ? trimmed : state.active
    ops.replace('/tabs', { order: newOrder, active, saved })
  }

  const duplicateSheet = (name: string) => {
    const idx = state.order.indexOf(name)
    if (idx < 0) return
    const newName = uniqueName(state.order)
    const saved = snapshotSaved()
    saved[newName] = { ...(saved[name] ?? blankBundle()) }
    const newOrder = [...state.order.slice(0, idx + 1), newName, ...state.order.slice(idx + 1)]
    ops.reset(hydrate(setTabs({ order: newOrder, active: newName, saved }), newName, saved))
  }

  const cycleTab = (delta: 1 | -1) => {
    const i = state.order.indexOf(state.active), n = state.order.length
    switchTab(state.order[(i + delta + n) % n])
  }

  return { switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet, cycleTab }
}
