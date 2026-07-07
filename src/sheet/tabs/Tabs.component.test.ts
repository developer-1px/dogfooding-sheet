import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { blankBundle } from '../schema'
import { Tabs } from './Tabs'
import type { Confirm } from '../useConfirm'
import type { TabsState } from './useTabs'

const flush = () => Promise.resolve()

describe('Tabs component', () => {
  let host: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  const renderTabs = (state: TabsState, confirm: Confirm = () => Promise.resolve(false)) => {
    const calls: string[] = []

    act(() => root.render(createElement(Tabs, {
      state,
      switchTab: (name) => calls.push(`switch:${name}`),
      addSheet: () => calls.push('add'),
      deleteSheet: (name) => calls.push(`delete:${name}`),
      renameSheet: (oldName, newName) => calls.push(`rename:${oldName}:${newName}`),
      duplicateSheet: (name) => calls.push(`duplicate:${name}`),
      setTabColor: (name, color) => calls.push(`color:${name}:${color}`),
      reorderTab: (from, to) => calls.push(`reorder:${from}:${to}`),
      confirm,
    })))

    return calls
  }

  it('labels sheet tab utility controls by action and sheet', () => {
    renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: { Budget: '#ff0000' },
    })

    expect(document.querySelector<HTMLInputElement>('.tab-color')?.getAttribute('aria-label')).toBe('Budget 탭 색상 변경')
    expect(document.querySelector<HTMLButtonElement>('.tab-dup')?.getAttribute('aria-label')).toBe('Budget 시트 복제')
    expect(document.querySelector<HTMLButtonElement>('.tab-close')?.getAttribute('aria-label')).toBe('Budget 시트 삭제')
    expect(document.querySelector<HTMLButtonElement>('.tab-add')?.getAttribute('aria-label')).toBe('시트 추가')
  })

  it('exposes rename input shortcuts after entering tab name edit mode', () => {
    renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: {},
    })

    const tab = document.querySelector<HTMLElement>('.tab')
    expect(tab).not.toBeNull()

    act(() => tab!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

    const rename = document.querySelector<HTMLInputElement>('.tab-rename')
    expect(rename?.getAttribute('aria-label')).toBe('Budget 시트 이름 편집')
    expect(rename?.getAttribute('title')).toBe('Budget 시트 이름 편집 (Enter=저장 / Esc=취소)')
    expect(rename?.getAttribute('aria-keyshortcuts')).toBe('Enter Escape')
  })

  it('does not render delete controls for the last remaining sheet', () => {
    renderTabs({
      order: ['Only'],
      active: 'Only',
      saved: {},
      colors: {},
    })

    expect(document.querySelector<HTMLButtonElement>('.tab-close')).toBeNull()
  })

  it('does not leak a rejected delete confirmation', async () => {
    const confirm: Confirm = () => Promise.reject(new Error('closed'))
    const calls = renderTabs({
      order: ['Sheet1', 'Sheet2'],
      active: 'Sheet1',
      saved: { Sheet2: blankBundle() },
      colors: {},
    }, confirm)

    const close = document.querySelector<HTMLButtonElement>('.tab-close')
    expect(close).not.toBeNull()
    act(() => close!.click())
    await flush()
    await flush()

    expect(calls).toEqual([])
  })
})
