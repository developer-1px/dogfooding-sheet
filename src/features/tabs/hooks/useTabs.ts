import { useEffect } from 'react'
import { appendSegment, type Pointer } from 'zod-crud'
import {
  MAX_SHEET_TABS,
  SheetSchema,
  blankBundle,
  bundleOf,
  cloneBundle,
  initialSheet,
  isSafeTabColor,
  normalizeSheetName,
  withBundle,
  type Sheet,
  type TabBundle,
  type Cells,
} from '../../../entities/Sheet/schema'
import { migrateLegacyKey } from '../../../shared/lib/legacyMigrate'

export interface TabsState {
  order: string[]
  active: string
  saved: Record<string, TabBundle>
  colors: Record<string, string>
}

interface TabsStateOps {
  replace(path: '/tabs', value: TabsState): void
}

export interface TabActionOps extends TabsStateOps {
  replaceSheet(sheet: Sheet): void
  moveBefore?(source: string, target: string): boolean
  moveAfter?(source: string, target: string): boolean
  setTabColor?(name: string, color: string): boolean
  clearTabColor?(name: string): boolean
}

const LEGACY_KEY = 'spreadsheet:tabs:v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const legacyCells = (value: unknown): Cells =>
  isRecord(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {}

export const coerceLegacyTabsState = (raw: unknown): TabsState | undefined => {
  if (!isRecord(raw) || !Array.isArray(raw.order) || typeof raw.active !== 'string' || !isRecord(raw.saved)) return undefined
  if (raw.order.length === 0 || raw.order.length > MAX_SHEET_TABS) return undefined

  const order: string[] = []
  const names = new Set<string>()
  for (const rawName of raw.order) {
    if (typeof rawName !== 'string') return undefined
    const name = normalizeSheetName(rawName)
    if (!name || names.has(name)) return undefined
    names.add(name)
    order.push(name)
  }

  const active = normalizeSheetName(raw.active)
  if (!active || !names.has(active)) return undefined

  const savedCells = new Map<string, Cells>()
  for (const [rawName, cells] of Object.entries(raw.saved)) {
    const name = normalizeSheetName(rawName)
    if (name && names.has(name)) savedCells.set(name, legacyCells(cells))
  }

  const tabs: TabsState = {
    order,
    active,
    colors: {},
    saved: Object.fromEntries(order.map((name) => [name, { ...blankBundle(), cells: savedCells.get(name) ?? {} }])),
  }
  const parsed = SheetSchema.safeParse({ ...initialSheet, tabs })
  return parsed.success ? parsed.data.tabs : undefined
}

const migrateLegacy = (state: TabsState, ops: TabsStateOps) =>
  migrateLegacyKey(LEGACY_KEY, state.order.length <= 1 && Object.keys(state.saved).length === 0, ops,
    coerceLegacyTabsState,
    (o, v) => o.replace('/tabs', v),
  )

export function useTabs(state: TabsState, ops: TabsStateOps) {
  useEffect(() => { migrateLegacy(state, ops) }, [state, ops])
  const setState = (s: TabsState) => ops.replace('/tabs', s)
  return { state, setState }
}

const uniqueName = (order: string[]): string | null => {
  if (order.length >= MAX_SHEET_TABS) return null
  const names = new Set(order)
  let n = order.length + 1
  while (names.has(`Sheet${n}`)) n++
  return normalizeSheetName(`Sheet${n}`)
}

const tabOrderItemPath = (index: number): string =>
  appendSegment('/tabs/order' as Pointer, index)

export function tabActions(sheet: Sheet, ops: TabActionOps) {
  const state = sheet.tabs
  const snapshotSaved = (): Record<string, TabBundle> => ({ ...state.saved, [state.active]: cloneBundle(bundleOf(sheet)) })
  const setTabs = (next: TabsState) => ({ ...sheet, tabs: next })
  const hydrate = (next: Sheet, name: string, saved: Record<string, TabBundle>): Sheet =>
    withBundle({ ...next, tabs: { ...next.tabs, active: name } }, cloneBundle(saved[name] ?? blankBundle()))
  const safeTabs = (next: TabsState): TabsState | null => {
    const parsed = SheetSchema.safeParse({ ...sheet, tabs: next })
    return parsed.success ? parsed.data.tabs : null
  }
  const replaceTabs = (next: TabsState) => {
    const tabs = safeTabs(next)
    if (tabs) ops.replace('/tabs', tabs)
  }
  const replaceSheet = (next: Sheet) => {
    const parsed = SheetSchema.safeParse(next)
    if (parsed.success) ops.replaceSheet(parsed.data)
  }

  const switchTab = (name: string) => {
    if (name === state.active || !state.order.includes(name)) return
    const saved = snapshotSaved()
    replaceSheet(hydrate(setTabs({ ...state, active: name, saved }), name, saved))
  }

  const addSheet = () => {
    const name = uniqueName(state.order)
    if (!name) return
    const saved = { ...snapshotSaved(), [name]: blankBundle() }
    replaceSheet(hydrate(setTabs({ ...state, order: [...state.order, name], active: name, saved }), name, saved))
  }

  const deleteSheet = (name: string) => {
    if (state.order.length <= 1 || !state.order.includes(name)) return
    const newOrder = state.order.filter((n) => n !== name)
    const saved = snapshotSaved()
    delete saved[name]
    const colors = { ...state.colors }; delete colors[name]
    const newActive = state.active === name ? newOrder[Math.max(0, state.order.indexOf(name) - 1)] : state.active
    replaceSheet(hydrate(setTabs({ ...state, order: newOrder, active: newActive, saved, colors }), newActive, saved))
  }

  const renameSheet = (oldName: string, newName: string) => {
    const trimmed = normalizeSheetName(newName)
    if (!state.order.includes(oldName) || !trimmed || trimmed === oldName || state.order.includes(trimmed)) return
    const saved = snapshotSaved()
    saved[trimmed] = saved[oldName] ?? blankBundle()
    delete saved[oldName]
    const newOrder = state.order.map((n) => (n === oldName ? trimmed : n))
    const active = state.active === oldName ? trimmed : state.active
    const colors = { ...state.colors }; if (colors[oldName]) { colors[trimmed] = colors[oldName]; delete colors[oldName] }
    replaceTabs({ order: newOrder, active, saved, colors })
  }

  const duplicateSheet = (name: string) => {
    const idx = state.order.indexOf(name)
    if (idx < 0) return
    const newName = uniqueName(state.order)
    if (!newName) return
    const saved = snapshotSaved()
    saved[newName] = cloneBundle(saved[name] ?? blankBundle())
    const newOrder = [...state.order.slice(0, idx + 1), newName, ...state.order.slice(idx + 1)]
    replaceSheet(hydrate(setTabs({ ...state, order: newOrder, active: newName, saved }), newName, saved))
  }

  const cycleTab = (delta: 1 | -1) => {
    const i = state.order.indexOf(state.active), n = state.order.length
    switchTab(state.order[(i + delta + n) % n])
  }
  const setTabColor = (name: string, color: string) => {
    if (!state.order.includes(name)) return
    const current = state.colors[name]
    if ((!color && current === undefined) || color === current) return
    const colors = { ...state.colors }
    if (color) {
      if (!isSafeTabColor(color)) return
      if (ops.setTabColor?.(name, color)) return
      colors[name] = color
    } else {
      if (ops.clearTabColor?.(name)) return
      delete colors[name]
    }
    replaceTabs({ ...state, colors })
  }
  const reorderTab = (from: string, to: string) => {
    const fi = state.order.indexOf(from), ti = state.order.indexOf(to)
    if (fi < 0 || ti < 0 || fi === ti) return
    const source = tabOrderItemPath(fi)
    const target = tabOrderItemPath(ti)
    if (fi < ti && ops.moveAfter?.(source, target)) return
    if (fi > ti && ops.moveBefore?.(source, target)) return
    const next = state.order.filter((n) => n !== from)
    next.splice(ti, 0, from)
    replaceTabs({ ...state, order: next })
  }
  return { switchTab, addSheet, deleteSheet, renameSheet, duplicateSheet, cycleTab, setTabColor, reorderTab }
}
