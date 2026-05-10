import { describe, it, expect } from 'vitest'
import { tabActions, type TabsState } from './useTabs'

const state = (): TabsState => ({
  order: ['Sheet1', 'Sheet2'],
  active: 'Sheet1',
  saved: { Sheet1: { A1: 'a' }, Sheet2: { A1: 'b' } },
})

describe('tabActions', () => {
  it('switchTab swaps active and replaces cells', () => {
    const s = state()
    let next: TabsState | null = null
    let replaced: Record<string, string> | null = null
    const a = tabActions(s, (n) => { next = n }, { A1: 'live' }, (c) => { replaced = c })
    a.switchTab('Sheet2')
    expect(next!.active).toBe('Sheet2')
    expect(next!.saved.Sheet1).toEqual({ A1: 'live' })
    expect(replaced).toEqual({ A1: 'b' })
  })
  it('renameSheet preserves cells under new key', () => {
    const s = state()
    let next: TabsState | null = null
    const a = tabActions(s, (n) => { next = n }, { A1: 'live' }, () => {})
    a.renameSheet('Sheet1', 'Foo')
    expect(next!.order).toEqual(['Foo', 'Sheet2'])
    expect(next!.saved.Foo).toEqual({ A1: 'a' })
    expect(next!.saved.Sheet1).toBeUndefined()
  })
  it('duplicateSheet copies cells to a new uniquely-named tab', () => {
    const s = state()
    let next: TabsState | null = null
    const a = tabActions(s, (n) => { next = n }, { A1: 'live' }, () => {})
    a.duplicateSheet('Sheet2')
    expect(next!.order).toContain('Sheet3')
    expect(next!.saved.Sheet3).toEqual({ A1: 'b' })
  })
  it('deleteSheet refuses last sheet', () => {
    const single: TabsState = { order: ['Only'], active: 'Only', saved: { Only: {} } }
    let called = false
    const a = tabActions(single, () => { called = true }, {}, () => {})
    a.deleteSheet('Only')
    expect(called).toBe(false)
  })
})
