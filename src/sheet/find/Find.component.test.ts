import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Find } from './Find'
import type { Cells, Display } from '../schema'
import { keyDown, setInputValue } from '../test-utils'

const appCss = () => readFileSync('src/App.css', 'utf8')
const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

describe('Find component', () => {
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

  const renderFind = (
    mode: 'find' | 'replace',
    cells: Cells = {},
    handlers: { onClose?: () => void; onJump?: (cellId: string) => void; onKeyDown?: (event: KeyboardEvent) => void } = {},
  ) => {
    const display: Display = (key) => cells[key] ?? ''
    const colLetters = Object.keys(cells).some((key) => key.startsWith('B')) ? ['A', 'B'] : ['A']

    const find = createElement(Find, {
      open: true,
      mode,
      onClose: handlers.onClose ?? (() => {}),
      cells,
      display,
      onJump: handlers.onJump ?? (() => {}),
      writeCell: () => {},
      writeCells: () => {},
      rowCount: 1,
      colLetters,
    })
    act(() => root.render(handlers.onKeyDown
      ? createElement('div', { onKeyDown: handlers.onKeyDown }, find)
      : find))
  }

  it('labels find mode controls and disables navigation without matches', () => {
    renderFind('find')

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')
    const status = document.querySelector<HTMLElement>('.count')
    expect(query?.type).toBe('text')
    expect(query?.placeholder).toBe('찾기')
    expect(query?.getAttribute('title')).toBe('찾을 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(query?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')
    expect(status?.id).toBeTruthy()
    expect(query?.getAttribute('aria-describedby')).toBe(status?.id)
    const caseSensitive = document.querySelector<HTMLInputElement>('input[aria-label="대소문자 구분 꺼짐"]')
    const regex = document.querySelector<HTMLInputElement>('input[aria-label="정규식 사용 꺼짐"]')
    expect(caseSensitive?.type).toBe('checkbox')
    expect(caseSensitive?.parentElement?.getAttribute('title')).toBe('대소문자 구분 꺼짐')
    expect(regex?.type).toBe('checkbox')
    expect(regex?.parentElement?.getAttribute('title')).toBe('정규식 사용 꺼짐')

    const previous = document.querySelector<HTMLButtonElement>('button[aria-label="이동할 이전 찾기 결과 없음"]')
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="이동할 다음 찾기 결과 없음"]')

    expect(previous?.textContent).toBe('↑')
    expect(previous?.disabled).toBe(true)
    expect(previous?.getAttribute('title')).toBe('이동할 이전 찾기 결과 없음')
    expect(previous?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(next?.textContent).toBe('↓')
    expect(next?.disabled).toBe(true)
    expect(next?.getAttribute('title')).toBe('이동할 다음 찾기 결과 없음')
    expect(next?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(status?.textContent).toBe('')
    expect(status?.getAttribute('role')).toBe('status')
    expect(status?.getAttribute('aria-live')).toBe('polite')
    expect(status?.getAttribute('aria-atomic')).toBe('true')
    expect(status?.getAttribute('title')).toBe('찾기 대기 중')
    expect(status?.getAttribute('aria-label')).toBe('찾기 대기 중')
    const close = document.querySelector<HTMLButtonElement>('button[aria-label="찾기 닫기"]')
    expect(close?.textContent).toBe('✕')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('찾기 닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')
  })

  it('updates option checkbox labels when toggled', () => {
    renderFind('find')

    const caseSensitive = document.querySelector<HTMLInputElement>('input[aria-label="대소문자 구분 꺼짐"]')!
    const regex = document.querySelector<HTMLInputElement>('input[aria-label="정규식 사용 꺼짐"]')!
    expect(caseSensitive.parentElement?.textContent).toBe('Aa')
    expect(regex.parentElement?.textContent).toBe('.*')

    act(() => caseSensitive.click())
    const enabledCaseSensitive = document.querySelector<HTMLInputElement>('input[aria-label="대소문자 구분 켜짐"]')
    expect(enabledCaseSensitive?.checked).toBe(true)
    expect(enabledCaseSensitive?.parentElement?.getAttribute('title')).toBe('대소문자 구분 켜짐')

    act(() => regex.click())
    const enabledRegex = document.querySelector<HTMLInputElement>('input[aria-label="정규식 사용 켜짐"]')
    expect(enabledRegex?.checked).toBe(true)
    expect(enabledRegex?.parentElement?.getAttribute('title')).toBe('정규식 사용 켜짐')
  })

  it('keeps find text fields and option checkboxes on separate sizing rules', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const textInputRule = css.match(/\.find-bar input\[type="text"\]\s*\{[^}]+\}/)?.[0] ?? ''
    const checkboxRule = css.match(/\.find-bar input\[type="checkbox"\]\s*\{[^}]+\}/)?.[0] ?? ''
    const labelRule = css.match(/\.find-bar label\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-size-find-input-width: 200px;')
    expect(textInputRule).toContain('flex: 1 1 var(--sheet-size-find-input-width, 200px);')
    expect(textInputRule).toContain('width: var(--sheet-size-find-input-width, 200px);')
    expect(checkboxRule).toContain('flex: 0 0 auto;')
    expect(checkboxRule).toContain('width: var(--sheet-size-control-sm, 16px);')
    expect(checkboxRule).toContain('height: var(--sheet-size-control-sm, 16px);')
    expect(checkboxRule).toContain('margin: 0;')
    expect(labelRule).toContain('display: inline-flex;')
    expect(labelRule).toContain('flex: 0 0 auto;')
    expect(labelRule).toContain('align-items: center;')
  })

  it('keeps find count and action buttons from shrinking', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const countRule = css.match(/\.find-bar \.count\s*\{[^}]+\}/)?.[0] ?? ''
    const buttonRule = css.match(/\.find-bar button\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-size-find-count-width: 50px;')
    expect(countRule).toContain('flex: 0 0 auto;')
    expect(countRule).toContain('min-width: var(--sheet-size-find-count-width, 50px);')
    expect(buttonRule).toContain('flex: 0 0 auto;')
    expect(buttonRule).toContain('padding: var(--sheet-space-1, 4px) var(--sheet-space-3, 8px);')
  })

  it('keeps the find bar vertically contained within the viewport', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const findBarRule = css.match(/\.find-bar\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-inset-find-bar-top: 60px;')
    expect(rootCss).toContain('--sheet-inset-find-bar-inline: 16px;')
    expect(findBarRule).toContain('top: var(--sheet-inset-find-bar-top, 60px);')
    expect(findBarRule).toContain('right: var(--sheet-inset-find-bar-inline, 16px);')
    expect(findBarRule).toContain('max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-inset-find-bar-inline, 16px) - var(--sheet-inset-find-bar-inline, 16px)));')
    expect(findBarRule).toContain('max-height: max(var(--sheet-space-8, 24px), calc(100vh - var(--sheet-inset-find-bar-top, 60px) - var(--sheet-space-8, 24px)));')
    expect(findBarRule).toContain('overflow-x: hidden;')
    expect(findBarRule).toContain('overflow-y: auto;')
  })

  it('announces no-match and matched result counts as status text', () => {
    renderFind('find', { A1: 'Alpha', B1: 'Beta' })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')
    const status = document.querySelector<HTMLElement>('.count[role="status"]')

    expect(query).not.toBeNull()
    expect(status?.textContent).toBe('')

    act(() => setInputValue(query!, 'Missing'))
    expect(status?.textContent).toBe('0개')
    expect(status?.getAttribute('title')).toBe('찾기 결과 없음')
    expect(status?.getAttribute('aria-label')).toBe('찾기 결과 없음')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="이동할 다음 찾기 결과 없음"]')?.disabled).toBe(true)

    act(() => setInputValue(query!, 'Alpha'))
    expect(status?.textContent).toBe('1/1')
    expect(status?.getAttribute('title')).toBe('찾기 결과 1/1, 현재 셀 A1')
    expect(status?.getAttribute('aria-label')).toBe('찾기 결과 1/1, 현재 셀 A1')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다음 찾기 결과, 이동 셀 A1"]')?.disabled).toBe(false)
  })

  it('keeps button activation keys from directly triggering find bar Enter shortcuts', () => {
    const jumps: string[] = []
    renderFind('find', { A1: 'Alpha', B1: 'Alpha' }, { onJump: (cellId) => jumps.push(cellId) })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')!

    act(() => setInputValue(query, 'Alpha'))
    const previous = document.querySelector<HTMLButtonElement>('button[aria-label="이전 찾기 결과, 이동 셀 B1"]')!
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="다음 찾기 결과, 이동 셀 B1"]')!
    expect(previous.textContent).toBe('↑')
    expect(previous.getAttribute('title')).toBe('이전 찾기 결과, 이동 셀 B1 (Shift+Enter)')
    expect(previous.getAttribute('aria-label')).toBe('이전 찾기 결과, 이동 셀 B1')
    expect(previous.getAttribute('aria-keyshortcuts')).toBe('Shift+Enter')
    expect(next.textContent).toBe('↓')
    expect(next.getAttribute('title')).toBe('다음 찾기 결과, 이동 셀 B1 (Enter)')
    expect(next.getAttribute('aria-label')).toBe('다음 찾기 결과, 이동 셀 B1')
    expect(next.getAttribute('aria-keyshortcuts')).toBe('Enter')
    expect(next.disabled).toBe(false)
    expect(jumps).toEqual(['r0-A'])

    jumps.length = 0
    act(() => keyDown(query, 'Enter'))
    expect(jumps).toEqual(['r0-B'])

    jumps.length = 0
    act(() => keyDown(next, 'Enter'))
    expect(jumps).toEqual([])

    act(() => next.click())
    expect(jumps).toEqual(['r0-A'])
  })

  it('keeps option checkbox keys from triggering find bar shortcuts', () => {
    const jumps: string[] = []
    const parentKeys: string[] = []
    renderFind('find', { A1: 'Alpha', B1: 'Alpha' }, {
      onJump: (cellId) => jumps.push(cellId),
      onKeyDown: (event) => parentKeys.push(event.key),
    })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')!
    const caseSensitive = document.querySelector<HTMLInputElement>('input[aria-label="대소문자 구분 꺼짐"]')!
    const regex = document.querySelector<HTMLInputElement>('input[aria-label="정규식 사용 꺼짐"]')!

    act(() => setInputValue(query, 'Alpha'))
    expect(jumps).toEqual(['r0-A'])

    jumps.length = 0
    parentKeys.length = 0
    act(() => keyDown(caseSensitive, 'Enter'))
    expect(jumps).toEqual([])
    expect(parentKeys).toEqual([])

    act(() => keyDown(regex, ' '))
    expect(parentKeys).toEqual([])
  })

  it('keeps find and replace text field keys from reaching parent shortcuts', () => {
    const jumps: string[] = []
    const parentKeys: string[] = []
    renderFind('replace', { A1: 'Alpha', B1: 'Alpha' }, {
      onJump: (cellId) => jumps.push(cellId),
      onKeyDown: (event) => parentKeys.push(event.key),
    })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')!
    const replacement = document.querySelector<HTMLInputElement>('input[aria-label="바꿀 내용"]')!

    act(() => setInputValue(query, 'Alpha'))
    expect(query.value).toBe('Alpha')
    expect(jumps).toEqual(['r0-A'])

    parentKeys.length = 0
    jumps.length = 0
    act(() => keyDown(query, 'ArrowLeft'))
    expect(parentKeys).toEqual([])
    expect(jumps).toEqual([])

    act(() => keyDown(query, 'Enter'))
    expect(parentKeys).toEqual([])
    expect(jumps).toEqual(['r0-B'])

    act(() => setInputValue(replacement, 'Omega'))
    expect(replacement.value).toBe('Omega')

    parentKeys.length = 0
    jumps.length = 0
    act(() => keyDown(replacement, 'ArrowLeft'))
    expect(parentKeys).toEqual([])
    expect(jumps).toEqual([])

    act(() => keyDown(replacement, 'Enter', { shiftKey: true }))
    expect(parentKeys).toEqual([])
    expect(jumps).toEqual(['r0-A'])
  })

  it('keeps Escape close handling available from find bar buttons', () => {
    const closes: string[] = []
    renderFind('find', {}, { onClose: () => closes.push('close') })

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="찾기 닫기"]')!

    act(() => keyDown(close, 'Escape'))
    expect(closes).toEqual(['close'])
  })

  it('labels replace mode inputs and actions', () => {
    renderFind('replace', { A1: 'Alpha' })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')
    const replacement = document.querySelector<HTMLInputElement>('input[aria-label="바꿀 내용"]')
    const status = document.querySelector<HTMLElement>('.count')

    expect(query?.type).toBe('text')
    expect(query?.placeholder).toBe('찾기')
    expect(query?.getAttribute('title')).toBe('찾을 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(query?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')
    expect(status?.id).toBeTruthy()
    expect(query?.getAttribute('aria-describedby')).toBe(status?.id)
    expect(replacement?.type).toBe('text')
    expect(replacement?.placeholder).toBe('바꾸기')
    expect(replacement?.getAttribute('title')).toBe('바꿀 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(replacement?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')
    expect(replacement?.getAttribute('aria-describedby')).toBe(status?.id)

    const replaceOne = document.querySelector<HTMLButtonElement>('button[aria-label="바꿀 현재 찾기 결과 없음"]')
    const replaceAll = document.querySelector<HTMLButtonElement>('button[aria-label="바꿀 찾기 결과 없음"]')

    expect(replaceOne?.textContent).toBe('바꾸기')
    expect(replaceOne?.disabled).toBe(true)
    expect(replaceOne?.getAttribute('title')).toBe('바꿀 현재 찾기 결과 없음')
    expect(replaceOne?.getAttribute('aria-label')).toBe('바꿀 현재 찾기 결과 없음')
    expect(replaceAll?.textContent).toBe('전체')
    expect(replaceAll?.disabled).toBe(true)
    expect(replaceAll?.getAttribute('title')).toBe('바꿀 찾기 결과 없음')
    expect(replaceAll?.getAttribute('aria-label')).toBe('바꿀 찾기 결과 없음')

    act(() => setInputValue(query!, 'Alpha'))
    expect(replaceOne?.textContent).toBe('바꾸기')
    expect(replaceOne?.disabled).toBe(false)
    expect(replaceOne?.getAttribute('title')).toBe('현재 찾기 결과 바꾸기, 현재 셀 A1')
    expect(replaceOne?.getAttribute('aria-label')).toBe('현재 찾기 결과 바꾸기, 현재 셀 A1')
    expect(replaceAll?.textContent).toBe('전체')
    expect(replaceAll?.disabled).toBe(false)
    expect(replaceAll?.getAttribute('title')).toBe('모든 찾기 결과 바꾸기, 1개 셀')
    expect(replaceAll?.getAttribute('aria-label')).toBe('모든 찾기 결과 바꾸기, 1개 셀')

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="찾기 및 바꾸기 닫기"]')
    expect(close?.textContent).toBe('✕')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('찾기 및 바꾸기 닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')
  })

  it('keeps the find bar constrained to the viewport', () => {
    const css = overlaysCss()

    expect(css).toContain('display: flex; flex-wrap: wrap;')
    expect(css).toContain(
      'max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-inset-find-bar-inline, 16px) - var(--sheet-inset-find-bar-inline, 16px)))',
    )
    expect(css).toContain('flex: 1 1 var(--sheet-size-find-input-width, 200px); width: var(--sheet-size-find-input-width, 200px); max-width: 100%;')
  })
})
