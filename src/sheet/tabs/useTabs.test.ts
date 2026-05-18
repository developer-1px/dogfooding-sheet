import { describe, it, expect } from 'vitest'
import { tabActions } from './useTabs'
import { blankBundle, initialSheet, type Sheet } from '../schema'

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

interface Stub { reset?: Sheet; replace?: { path: string; value: unknown } }
const stubOps = (s: Stub) => ({
  reset: (v: Sheet) => { s.reset = v },
  replace: (path: string, value: unknown) => { s.replace = { path, value } },
}) as never

describe('tabActions', () => {
  it('switchTab swaps active, snapshots current bundle, hydrates target', () => {
    const sheet = make()
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).switchTab('Sheet2')
    expect(s.reset!.tabs.active).toBe('Sheet2')
    expect(s.reset!.tabs.saved.Sheet1.cells).toEqual({ A1: 'live' })
    expect(s.reset!.cells).toEqual({ A1: 'b' })
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
    expect(s.reset!.tabs.order).toContain('Sheet3')
    expect(s.reset!.tabs.saved.Sheet3.cells).toEqual({ A1: 'b' })
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
    expect(s.reset!.styles).toEqual({ B2: { i: true } })
    expect(s.reset!.notes).toEqual({ B2: 'world' })
    expect(s.reset!.tabs.saved.Sheet1.styles).toEqual({ A1: { b: true } })
    expect(s.reset!.tabs.saved.Sheet1.notes).toEqual({ A1: 'hello' })
  })
  it('deleteSheet refuses last sheet', () => {
    const sheet: Sheet = { ...initialSheet, tabs: { order: ['Only'], active: 'Only', colors: {}, saved: { Only: blankBundle() } } }
    const s: Stub = {}
    tabActions(sheet, stubOps(s)).deleteSheet('Only')
    expect(s.reset).toBeUndefined()
  })
})
