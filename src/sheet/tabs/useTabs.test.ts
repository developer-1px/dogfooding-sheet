import { describe, it, expect } from 'vitest'
import { coerceLegacyTabsState, tabActions, type TabActionOps } from './useTabs'
import { MAX_SHEET_NAME_LENGTH, MAX_SHEET_TABS, blankBundle, initialSheet, type Sheet } from '../schema'
import { MAX_CELL_TEXT_LENGTH } from '../cellValue'

const make = (): Sheet => ({
  ...initialSheet,
  cells: { A1: 'live' },
  tabs: {
    order: ['Sheet1', 'Sheet2'],
    active: 'Sheet1',
    colors: {},
    saved: {
      Sheet1: { ...blankBundle(), cells: { A1: 'a' } },
      Sheet2: { ...blankBundle(), cells: { A1: 'b' } },
    },
  },
})

interface Stub {
  root?: Sheet
  replace?: { path: string; value: unknown }
  move?: { kind: 'before' | 'after'; source: string; target: string }
}
const stubOps = (s: Stub) => ({
  replace: (path: '/tabs', value: Sheet['tabs']) => { s.replace = { path, value } },
  replaceSheet: (value: Sheet) => { s.root = value },
  moveBefore: (source: string, target: string) => { s.move = { kind: 'before', source, target }; return true },
  moveAfter: (source: string, target: string) => { s.move = { kind: 'after', source, target }; return true },
}) satisfies TabActionOps

describe('tabActions', () => {
  it('switchTab swaps active, snapshots current bundle, hydrates target', () => {
    const sheet = make()
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).switchTab('Sheet2')
    expect(s.root!.tabs.active).toBe('Sheet2')
    expect(s.root!.tabs.saved.Sheet1.cells).toEqual({ A1: 'live' })
    expect(s.root!.cells).toEqual({ A1: 'b' })
  })
  it('renameSheet preserves bundle under new key (no reset)', () => {
    const sheet = make()
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).renameSheet('Sheet1', 'Foo')
    const tabs = (s.replace!.value as Sheet['tabs'])
    expect(tabs.order).toEqual(['Foo', 'Sheet2'])
    expect(tabs.saved.Foo.cells).toEqual({ A1: 'live' })
    expect(tabs.saved.Sheet1).toBeUndefined()
  })
  it('duplicateSheet copies bundle to uniquely-named tab', () => {
    const sheet = make()
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).duplicateSheet('Sheet2')
    expect(s.root!.tabs.order).toContain('Sheet3')
    expect(s.root!.tabs.saved.Sheet3.cells).toEqual({ A1: 'b' })
    expect(s.root!.tabs.saved.Sheet3.cells).not.toBe(sheet.tabs.saved.Sheet2.cells)
    expect(s.root!.cells).not.toBe(s.root!.tabs.saved.Sheet3.cells)
  })
  it('switchTab preserves per-tab styles/notes (multi-sheet partition)', () => {
    const sheet: Sheet = {
      ...make(),
      styles: { A1: { b: true } },
      notes: { A1: 'hello' },
    }
    sheet.tabs.saved.Sheet2 = { ...blankBundle(), cells: { A1: 'b' }, styles: { B2: { i: true } }, notes: { B2: 'world' } }
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).switchTab('Sheet2')
    expect(s.root!.styles).toEqual({ B2: { i: true } })
    expect(s.root!.notes).toEqual({ B2: 'world' })
    expect(s.root!.tabs.saved.Sheet1.styles).toEqual({ A1: { b: true } })
    expect(s.root!.tabs.saved.Sheet1.notes).toEqual({ A1: 'hello' })
  })
  it('deleteSheet refuses last sheet', () => {
    const sheet: Sheet = { ...initialSheet, tabs: { order: ['Only'], active: 'Only', colors: {}, saved: { Only: blankBundle() } } }
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).deleteSheet('Only')
    expect(s.root).toBeUndefined()
  })

  it('refuses tab creation past the tab cap', () => {
    const order = Array.from({ length: MAX_SHEET_TABS }, (_v, i) => `S${i + 1}`)
    const sheet: Sheet = {
      ...initialSheet,
      tabs: {
        order,
        active: order[0],
        colors: {},
        saved: Object.fromEntries(order.map((name) => [name, blankBundle()])),
      },
    }
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).addSheet()
    tabActions(sheet, stubOps(s)).duplicateSheet(order[0])

    expect(s.root).toBeUndefined()
  })

  it('refuses unsafe tab names and colors', () => {
    const sheet = make()
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).renameSheet('Ghost', 'Valid')
    tabActions(sheet, stubOps(s)).renameSheet('Sheet1', 'x'.repeat(MAX_SHEET_NAME_LENGTH + 1))
    tabActions(sheet, stubOps(s)).setTabColor('Sheet1', 'red')
    tabActions(sheet, stubOps(s)).setTabColor('Ghost', '#ff0000')

    expect(s.replace).toBeUndefined()
  })

  it('reorders tabs only when both tab names exist', () => {
    const sheet = make()
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).reorderTab('Ghost', 'Sheet1')
    tabActions(sheet, stubOps(s)).reorderTab('Sheet1', 'Missing')
    expect(s.replace).toBeUndefined()

    tabActions(sheet, stubOps(s)).reorderTab('Sheet2', 'Sheet1')
    expect(s.move).toEqual({ kind: 'before', source: '/tabs/order/1', target: '/tabs/order/0' })
  })

  it('uses collection after-move when reordering a tab forward', () => {
    const sheet: Sheet = {
      ...make(),
      tabs: {
        ...make().tabs,
        order: ['Sheet1', 'Sheet2', 'Sheet3'],
        saved: { Sheet1: blankBundle(), Sheet2: blankBundle(), Sheet3: blankBundle() },
      },
    }
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).reorderTab('Sheet1', 'Sheet3')

    expect(s.move).toEqual({ kind: 'after', source: '/tabs/order/0', target: '/tabs/order/2' })
  })

  it('accepts normalized tab names and colors', () => {
    const sheet = make()
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).renameSheet('Sheet1', '  Budget  ')
    expect((s.replace!.value as Sheet['tabs']).order).toEqual(['Budget', 'Sheet2'])

    const c: Stub = {}
    tabActions(sheet, stubOps(c)).setTabColor('Sheet1', '#ff0000')
    expect((c.replace!.value as Sheet['tabs']).colors.Sheet1).toBe('#ff0000')
  })

  it('skips tab color writes when the color state is unchanged', () => {
    const base = make()
    const sheet: Sheet = { ...base, tabs: { ...base.tabs, colors: { Sheet1: '#ff0000' } } }
    const s: Stub = {}

    tabActions(sheet, stubOps(s)).setTabColor('Sheet1', '#ff0000')
    tabActions(sheet, stubOps(s)).setTabColor('Sheet2', '')

    expect(s.replace).toBeUndefined()
  })
})

describe('coerceLegacyTabsState', () => {
  it('normalizes and sanitizes legacy tab storage', () => {
    const migrated = coerceLegacyTabsState({
      order: [' Sheet1 ', ' Sheet2 '],
      active: ' Sheet1 ',
      saved: {
        Sheet1: { A1: 'live', B1: '', C1: 'x'.repeat(MAX_CELL_TEXT_LENGTH + 1) },
        Sheet2: { A1: 'saved', Z9999: 'outside' },
        Ghost: { A1: 'ghost' },
      },
    })

    expect(migrated).toBeDefined()
    expect(migrated!.order).toEqual(['Sheet1', 'Sheet2'])
    expect(migrated!.active).toBe('Sheet1')
    expect(migrated!.colors).toEqual({})
    expect(migrated!.saved.Sheet1.cells).toEqual({ A1: 'live' })
    expect(migrated!.saved.Sheet2.cells).toEqual({ A1: 'saved' })
    expect(migrated!.saved.Ghost).toBeUndefined()
  })

  it('rejects legacy tab storage that violates current tab invariants', () => {
    expect(coerceLegacyTabsState({ order: ['A', 'A'], active: 'A', saved: {} })).toBeUndefined()
    expect(coerceLegacyTabsState({ order: ['A'], active: 'B', saved: {} })).toBeUndefined()
    expect(coerceLegacyTabsState({ order: ['x'.repeat(MAX_SHEET_NAME_LENGTH + 1)], active: 'A', saved: {} })).toBeUndefined()
    expect(coerceLegacyTabsState({
      order: Array.from({ length: MAX_SHEET_TABS + 1 }, (_v, i) => `S${i + 1}`),
      active: 'S1',
      saved: {},
    })).toBeUndefined()
  })
})
