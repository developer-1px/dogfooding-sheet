import { act, createElement, type KeyboardEventHandler } from 'react'
import { readFileSync } from 'node:fs'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAX_SHEET_TABS, blankBundle } from '../schema'
import { keyDown, setInputValue } from '../test-utils'
import { DEFAULT_TAB_COLOR, Tabs } from './Tabs'
import type { Confirm } from '../useConfirm'
import type { TabsState } from './useTabs'

const flush = () => Promise.resolve()
const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')
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

    const tabs = [...document.querySelectorAll<HTMLElement>('.tab')]

    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Budget 시트 탭, 현재 선택됨', 'Forecast 시트 탭'])
    expect(tabs.map((tab) => tab.getAttribute('title'))).toEqual([
      'Budget 시트 탭 (현재 선택됨) - 더블클릭=이름 변경 / 드래그=순서 변경',
      'Forecast 시트 탭 - 더블클릭=이름 변경 / 드래그=순서 변경',
    ])
    const colorPickers = [...document.querySelectorAll<HTMLInputElement>('.tab-color')]
    expect(colorPickers[0]?.value).toBe('#ff0000')
    expect(colorPickers[0]?.getAttribute('aria-label')).toBe('Budget 탭 색상 변경 (현재 색상 #ff0000)')
    expect(colorPickers[0]?.getAttribute('title')).toBe('Budget 탭 색상 변경 (현재 색상 #ff0000)')
    expect(colorPickers[1]?.value).toBe(DEFAULT_TAB_COLOR)
    expect(colorPickers[1]?.getAttribute('aria-label')).toBe('Forecast 탭 색상 변경 (현재 기본 색상)')
    expect(colorPickers[1]?.getAttribute('title')).toBe('Forecast 탭 색상 변경 (현재 기본 색상)')
    expect(document.querySelector<HTMLButtonElement>('.tab-dup')?.getAttribute('aria-label')).toBe('Budget 시트 복제')
    expect(document.querySelector<HTMLButtonElement>('.tab-dup')?.getAttribute('title')).toBe('Budget 시트 복제')
    expect(document.querySelector<HTMLButtonElement>('.tab-dup')?.disabled).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('.tab-close')?.getAttribute('aria-label')).toBe('Budget 시트 삭제')
    expect(document.querySelector<HTMLButtonElement>('.tab-add')?.getAttribute('aria-label')).toBe('시트 추가')
    expect(document.querySelector<HTMLButtonElement>('.tab-add')?.getAttribute('title')).toBe('시트 추가')
    expect(document.querySelector<HTMLButtonElement>('.tab-add')?.disabled).toBe(false)
  })

  it('keeps long sheet names compact while exposing the full tab name', () => {
    const longName = 'Quarterly Forecast With A Very Long Scenario Name'

    renderTabs({
      order: [longName, 'Forecast'],
      active: longName,
      saved: { Forecast: blankBundle() },
      colors: {},
    })

    const tab = document.querySelector<HTMLElement>('.tab')
    const label = document.querySelector<HTMLElement>('.tab-label')

    expect(label?.textContent).toBe(longName)
    expect(tab?.getAttribute('aria-label')).toBe(`${longName} 시트 탭, 현재 선택됨`)
    expect(tab?.getAttribute('title')).toBe(`${longName} 시트 탭 (현재 선택됨) - 더블클릭=이름 변경 / 드래그=순서 변경`)
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

  it('keeps inactive tab utility controls visible while keyboard focus is inside the tab', () => {
    const css = overlaysCss()

    expect(css).toMatch(/\.tab:focus-within\s+\.tab-dup,\s*\.tab:focus-within\s+\.tab-close\s*\{\s*opacity:\s*1;\s*\}/)
  })

  it('keeps inactive tab color pickers visible while keyboard focus is inside the tab', () => {
    const css = overlaysCss()

    expect(css).toMatch(/\.tab:focus-within\s+\.tab-color\s*\{\s*opacity:\s*1;\s*\}/)
  })

  it('keeps disabled tab creation controls from showing enabled hover affordances', () => {
    const css = overlaysCss()

    expect(css).toContain('.tab-dup:hover:not(:disabled)')
    expect(css).toContain('.tab-add:hover:not(:disabled)')
    expect(css).toMatch(/\.tab-dup:disabled,\s*\.tab-add:disabled\s*\{\s*color:\s*var\(--sheet-color-disabled,\s*#9aa0a6\);\s*cursor:\s*not-allowed;\s*\}/)
  })

  it('keeps overflowing sheet tabs contained in a horizontal tab strip', () => {
    const css = overlaysCss()

    expect(css).toContain('overflow-x: auto; max-width: 100%; min-width: 0;')
    expect(css).toContain('display: inline-flex; flex: 0 0 auto; align-items: center;')
    expect(css).toContain('.tab-add { flex: 0 0 auto;')
  })

  it('keeps tab utility controls from shrinking inside tabs', () => {
    const css = overlaysCss()
    const closeAndAddRule = css.match(/\.tab-close,\s*\.tab-add\s*\{[^}]+\}/)?.[0] ?? ''
    const duplicateRule = css.match(/\.tab-dup\s*\{[^}]+\}/)?.[0] ?? ''
    const colorRule = css.match(/\.tab-color\s*\{[^}]+\}/)?.[0] ?? ''

    expect(closeAndAddRule).toContain('flex: 0 0 auto;')
    expect(duplicateRule).toContain('flex: 0 0 auto;')
    expect(colorRule).toContain('flex: 0 0 auto;')
  })

  it('keeps long sheet tab labels truncated inside a stable tab width', () => {
    const css = overlaysCss()

    expect(css).toContain('max-width: 220px;')
    expect(css).toContain('.tab-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }')
  })

  it('keeps the tab rename input contained inside the tab width', () => {
    const css = overlaysCss()
    const renameRule = css.match(/\.tab-rename\s*\{[^}]+\}/)?.[0] ?? ''

    expect(renameRule).toContain('width: 90px;')
    expect(renameRule).toContain('min-width: 0;')
    expect(renameRule).toContain('max-width: 100%;')
    expect(renameRule).toContain('flex: 1 1 90px;')
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

  it('disables tab creation controls at the maximum tab count', () => {
    const order = Array.from({ length: MAX_SHEET_TABS }, (_unused, index) => `Sheet${index + 1}`)
    const calls = renderTabs({
      order,
      active: 'Sheet1',
      saved: {},
      colors: {},
    })

    const duplicateButtons = [...document.querySelectorAll<HTMLButtonElement>('.tab-dup')]
    const add = document.querySelector<HTMLButtonElement>('.tab-add')

    expect(duplicateButtons).toHaveLength(MAX_SHEET_TABS)
    expect(duplicateButtons.every((button) => button.disabled)).toBe(true)
    expect(duplicateButtons[0]?.getAttribute('aria-label')).toBe(`Sheet1 시트 복제 불가, 시트 최대 개수 ${MAX_SHEET_TABS}개 도달`)
    expect(duplicateButtons[0]?.getAttribute('title')).toBe(`Sheet1 시트 복제 불가, 시트 최대 개수 ${MAX_SHEET_TABS}개 도달`)
    expect(add?.disabled).toBe(true)
    expect(add?.getAttribute('aria-label')).toBe(`시트 최대 개수 ${MAX_SHEET_TABS}개 도달`)
    expect(add?.getAttribute('title')).toBe(`시트 최대 개수 ${MAX_SHEET_TABS}개 도달`)

    act(() => duplicateButtons[0]!.click())
    act(() => add!.click())

    expect(calls).toEqual([])
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
