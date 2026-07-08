import { act, createElement, type KeyboardEvent } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Find } from './Find'
import type { Cells, Display } from '../schema'
import { keyDown, setInputValue } from '../test-utils'

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
    expect(query?.placeholder).toBe('찾기')
    expect(query?.getAttribute('title')).toBe('찾을 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(query?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')
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
    expect(previous?.getAttribute('title')).toBe('이동할 이전 찾기 결과 없음 (Shift+Enter)')
    expect(previous?.getAttribute('aria-keyshortcuts')).toBe('Shift+Enter')
    expect(next?.textContent).toBe('↓')
    expect(next?.disabled).toBe(true)
    expect(next?.getAttribute('title')).toBe('이동할 다음 찾기 결과 없음 (Enter)')
    expect(next?.getAttribute('aria-keyshortcuts')).toBe('Enter')
    expect(document.querySelector('.count')?.textContent).toBe('')
    expect(document.querySelector('.count')?.getAttribute('role')).toBe('status')
    expect(document.querySelector('.count')?.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('.count')?.getAttribute('aria-atomic')).toBe('true')
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
    expect(next.textContent).toBe('↓')
    expect(next.getAttribute('title')).toBe('다음 찾기 결과, 이동 셀 B1 (Enter)')
    expect(next.getAttribute('aria-label')).toBe('다음 찾기 결과, 이동 셀 B1')
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

    expect(query?.placeholder).toBe('찾기')
    expect(query?.getAttribute('title')).toBe('찾을 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(query?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')
    expect(replacement?.placeholder).toBe('바꾸기')
    expect(replacement?.getAttribute('title')).toBe('바꿀 내용 (Enter=다음 결과 / Shift+Enter=이전 결과 / Esc=닫기)')
    expect(replacement?.getAttribute('aria-keyshortcuts')).toBe('Enter Shift+Enter Escape')

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
})
