import { useEffect } from 'react'
import { blankBundle, bundleOf, withBundle, type Sheet, type SheetOps, type TabBundle, type Cells } from './schema'
import { migrateLegacyKey } from '../lib/legacyMigrate'

export interface TabsState {
  order: string[]
  active: string
  saved: Record<string, TabBundle>
  colors: Record<string, string>
}

const LEGACY_KEY = 'spreadsheet:tabs:v1'

const migrateLegacy = (state: TabsState, ops: SheetOps) =>
  migrateLegacyKey(LEGACY_KEY, state.order.length <= 1 && Object.keys(state.saved).length === 0, ops,
    (raw) => {
      const o = raw as { order?: unknown; active?: unknown; saved?: unknown } | null
      if (!Array.isArray(o?.order) || typeof o.active !== 'string' || !o.saved) return undefined
      return {
        order: o.order as string[], active: o.active, colors: {},
        saved: Object.fromEntries(Object.entries(o.saved as Record<string, Cells>)
          .map(([k, cells]) => [k, { ...blankBundle(), cells }])),
      } as TabsState
    },
    (o, v) => o.replace('/tabs', v),
  )

export function useTabs(state: TabsState, ops: SheetOps) {
  useEffect(() => { migrateLegacy(state, ops) }, [])
  const setState = (s: TabsState) => ops.replace('/tabs', s)
  return { state, setState }
}

const uniqueName = (order: string[]): string => {
  let n = order.length + 1
  while (order.includes(`Sheet${n}`)) n++
  return `Sheet${n}`
}

export function tabActions(sheet: Sheet, ops: SheetOps) {
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
    ops.reset(hydrate(setTabs({ ...state, order: [...state.order, name], active: name, saved }), name, saved))
  }

  const deleteSheet = (name: string) => {
    if (state.order.length <= 1 || !state.order.includes(name)) return
    const newOrder = state.order.filter((n) => n !== name)
    const saved = snapshotSaved()
    delete saved[name]
    const colors = { ...state.colors }; delete colors[name]
    const newActive = state.active === name ? newOrder[Math.max(0, state.order.indexOf(name) - 1)] : state.active
    ops.reset(hydrate(setTabs({ ...state, order: newOrder, active: newActive, saved, colors }), newActive, saved))
  }

  const renameSheet = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || state.order.includes(trimmed)) return
    const saved = snapshotSaved()
    saved[trimmed] = saved[oldName] ?? blankBundle()
    delete saved[oldName]
    const newOrder = state.order.map((n) => (n === oldName ? trimmed : n))
    const active = state.active === oldName ? trimmed : state.active
    const colors = { ...state.colors }; if (colors[oldName]) { colors[trimmed] = colors[oldName]; delete colors[oldName] }
    ops.replace('/tabs', { order: newOrder, active, saved, colors })
  }

  const duplicateSheet = (name: string) => {
    const idx = state.order.indexOf(name)
    if (idx < 0) return
    const newName = uniqueName(state.order)
    const saved = snapshotSaved()
    saved[newName] = { ...(saved[name] ?? blankBundle()) }
    const newOrder = [...state.order.slice(0, idx + 1), newName, ...state.order.slice(idx + 1)]
    ops.reset(hydrate(setTabs({ ...state, order: newOrder, active: newName, saved }), newName, saved))
  }

  const cycleTab = (delta: 1 | -1) => {
    const i = state.order.indexOf(state.active), n = state.order.length
    switchTab(state.order[(i + delta + n) % n])
  }
  const setTabColor = (name: string, color: string) => { const colors = { ...state.colors }; if (color) colors[name] = color; else delete colors[name]; ops.replace('/tabs', { ...state, colors }) }
  const reorderTab = (from: string, to: string) => { const fi = state.order.indexOf(from), ti = state.order.indexOf(to); if (fi < 0 || ti < 0 || fi === ti) return; const next = state.order.filter((n) => n !== from); next.splice(ti, 0, from); ops.replace('/tabs', { ...state, order: next }) }
  return { switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet, cycleTab, setTabColor, reorderTab }
}
