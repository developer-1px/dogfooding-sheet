import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Find } from './Find'
import type { Cells, Display } from '../schema'
import { setInputValue } from '../test-utils'

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

  const renderFind = (mode: 'find' | 'replace', cells: Cells = {}) => {
    const display: Display = (key) => cells[key] ?? ''
    const colLetters = Object.keys(cells).some((key) => key.startsWith('B')) ? ['A', 'B'] : ['A']

    act(() => root.render(createElement(Find, {
      open: true,
      mode,
      onClose: () => {},
      cells,
      display,
      onJump: () => {},
      writeCell: () => {},
      writeCells: () => {},
      rowCount: 1,
      colLetters,
    })))
  }

  it('labels find mode controls and disables navigation without matches', () => {
    renderFind('find')

    expect(document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')?.placeholder).toBe('찾기')
    expect(document.querySelector<HTMLInputElement>('input[aria-label="대소문자 구분"]')?.type).toBe('checkbox')
    expect(document.querySelector<HTMLInputElement>('input[aria-label="정규식 사용"]')?.type).toBe('checkbox')

    const previous = document.querySelector<HTMLButtonElement>('button[aria-label="이전 찾기 결과"]')
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="다음 찾기 결과"]')

    expect(previous?.textContent).toBe('↑')
    expect(previous?.disabled).toBe(true)
    expect(previous?.getAttribute('aria-keyshortcuts')).toBe('Shift+Enter')
    expect(next?.textContent).toBe('↓')
    expect(next?.disabled).toBe(true)
    expect(next?.getAttribute('aria-keyshortcuts')).toBe('Enter')
    expect(document.querySelector('.count')?.textContent).toBe('')
    expect(document.querySelector('.count')?.getAttribute('role')).toBe('status')
    expect(document.querySelector('.count')?.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('.count')?.getAttribute('aria-atomic')).toBe('true')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="찾기 닫기"]')?.textContent).toBe('✕')
  })

  it('announces no-match and matched result counts as status text', () => {
    renderFind('find', { A1: 'Alpha', B1: 'Beta' })

    const query = document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')
    const status = document.querySelector<HTMLElement>('.count[role="status"]')
    const next = document.querySelector<HTMLButtonElement>('button[aria-label="다음 찾기 결과"]')

    expect(query).not.toBeNull()
    expect(status?.textContent).toBe('')

    act(() => setInputValue(query!, 'Missing'))
    expect(status?.textContent).toBe('0개')
    expect(next?.disabled).toBe(true)

    act(() => setInputValue(query!, 'Alpha'))
    expect(status?.textContent).toBe('1/1')
    expect(next?.disabled).toBe(false)
  })

  it('labels replace mode inputs and actions', () => {
    renderFind('replace')

    expect(document.querySelector<HTMLInputElement>('input[aria-label="찾을 내용"]')?.placeholder).toBe('찾기')
    expect(document.querySelector<HTMLInputElement>('input[aria-label="바꿀 내용"]')?.placeholder).toBe('바꾸기')

    const replaceOne = document.querySelector<HTMLButtonElement>('button[aria-label="현재 찾기 결과 바꾸기"]')
    const replaceAll = document.querySelector<HTMLButtonElement>('button[aria-label="모든 찾기 결과 바꾸기"]')

    expect(replaceOne?.textContent).toBe('바꾸기')
    expect(replaceOne?.disabled).toBe(true)
    expect(replaceAll?.textContent).toBe('전체')
    expect(replaceAll?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="찾기 및 바꾸기 닫기"]')?.textContent).toBe('✕')
  })
})
