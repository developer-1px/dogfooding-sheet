import { act, createElement, type KeyboardEventHandler } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { blankBundle } from '../schema'
import { keyDown, setInputValue } from '../test-utils'
import { Tabs } from './Tabs'
import type { Confirm } from '../useConfirm'
import type { TabsState } from './useTabs'

const flush = () => Promise.resolve()
type RenderTabsOptions = { onKeyDown?: KeyboardEventHandler<HTMLDivElement> }

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

  const renderTabs = (state: TabsState, confirm: Confirm = () => Promise.resolve(false), options: RenderTabsOptions = {}) => {
    const calls: string[] = []

    act(() => root.render(createElement('div', { onKeyDown: options.onKeyDown },
      createElement(Tabs, {
        state,
        switchTab: (name) => calls.push(`switch:${name}`),
        addSheet: () => calls.push('add'),
        deleteSheet: (name) => calls.push(`delete:${name}`),
        renameSheet: (oldName, newName) => calls.push(`rename:${oldName}:${newName}`),
        duplicateSheet: (name) => calls.push(`duplicate:${name}`),
        setTabColor: (name, color) => calls.push(`color:${name}:${color}`),
        reorderTab: (from, to) => calls.push(`reorder:${from}:${to}`),
        confirm,
      }),
    )))

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

  it('keeps rename input keys inside the tab rename field', () => {
    const parentKeys: string[] = []
    const calls = renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: {},
    }, () => Promise.resolve(false), { onKeyDown: (event) => parentKeys.push(event.key) })

    const tab = document.querySelector<HTMLElement>('.tab')
    act(() => tab!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

    const rename = document.querySelector<HTMLInputElement>('.tab-rename')
    expect(rename?.getAttribute('aria-label')).toBe('Budget 시트 이름 편집')
    expect(rename?.getAttribute('title')).toBe('Budget 시트 이름 편집 (Enter=저장 / Esc=취소)')
    expect(rename?.getAttribute('aria-keyshortcuts')).toBe('Enter Escape')

    act(() => keyDown(rename!, 'ArrowRight'))
    act(() => keyDown(rename!, 'B'))
    act(() => setInputValue(rename!, 'Budget Q1'))
    act(() => keyDown(rename!, 'Enter'))

    expect(parentKeys).toEqual([])
    expect(calls).toEqual(['rename:Budget:Budget Q1'])
  })

  it('keeps rename input escape inside the tab rename field while cancelling', () => {
    const parentKeys: string[] = []
    const calls = renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: {},
    }, () => Promise.resolve(false), { onKeyDown: (event) => parentKeys.push(event.key) })

    const tab = document.querySelector<HTMLElement>('.tab')
    act(() => tab!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })))

    const rename = document.querySelector<HTMLInputElement>('.tab-rename')
    act(() => setInputValue(rename!, 'Budget Q2'))
    act(() => keyDown(rename!, 'Escape'))

    expect(parentKeys).toEqual([])
    expect(calls).toEqual([])
    expect(document.querySelector<HTMLInputElement>('.tab-rename')).toBeNull()
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

  it('keeps tab utility keyboard events from switching sheets', () => {
    const calls = renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: {},
    })

    const color = document.querySelector<HTMLInputElement>('.tab-color')
    const duplicate = document.querySelector<HTMLButtonElement>('.tab-dup')
    const close = document.querySelector<HTMLButtonElement>('.tab-close')

    act(() => color!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    act(() => duplicate!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    act(() => close!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))

    expect(calls).toEqual([])

    act(() => duplicate!.click())

    expect(calls).toEqual(['duplicate:Budget'])
  })

  it('keeps add-sheet activation keys inside the tab add control', () => {
    const parentKeys: string[] = []
    const calls = renderTabs({
      order: ['Budget', 'Forecast'],
      active: 'Budget',
      saved: { Forecast: blankBundle() },
      colors: {},
    }, () => Promise.resolve(false), { onKeyDown: (event) => parentKeys.push(event.key) })

    const add = document.querySelector<HTMLButtonElement>('.tab-add')

    expect(add?.type).toBe('button')
    expect(add?.textContent).toBe('+')
    expect(add?.getAttribute('title')).toBe('시트 추가')
    expect(add?.getAttribute('aria-label')).toBe('시트 추가')

    act(() => add!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    act(() => add!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))

    expect(parentKeys).toEqual([])
    expect(calls).toEqual([])

    act(() => add!.click())

    expect(calls).toEqual(['add'])
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
