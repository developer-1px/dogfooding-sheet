import { act, createElement, type KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { keyDown, setupReactDOM } from './test-utils'
import { HelpDialog } from './HelpDialog'

describe('HelpDialog', () => {
  const dom = setupReactDOM()

  it('documents shortcuts in a structured table', () => {
    const onClose = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(HelpDialog, {
        open: true,
        onClose,
      }),
    )))

    expect(document.querySelector('caption')?.textContent).toBe('키보드 단축키 목록')
    const columnHeaders = [...document.querySelectorAll('thead th')]
    expect(columnHeaders.map((th) => th.textContent)).toEqual(['단축키', '동작'])
    expect(columnHeaders.every((th) => th.getAttribute('scope') === 'col')).toBe(true)
    expect(document.querySelector('kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    const rowHeaders = [...document.querySelectorAll('tbody th[scope="row"]')]
    expect(rowHeaders[0]?.querySelector('kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    expect(rowHeaders.length).toBeGreaterThan(0)
    expect(document.querySelector('tbody tr td')?.textContent).toBe('실행 취소')
    expect(document.body.textContent).toContain('F4 (수식 입력 중)')
    expect(document.body.textContent).toContain('마지막 셀 참조의 절대/상대 형식 순환')
    expect(document.body.textContent).toContain('찾기창 Enter / Shift+Enter / Esc')
    expect(document.body.textContent).toContain('다음 결과 / 이전 결과 / 찾기창 닫기')

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="키보드 단축키 도움말 닫기"]')
    expect(close?.textContent).toBe('닫기')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')

    act(() => keyDown(close!, 'Enter'))
    act(() => keyDown(close!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(close!, 'Escape'))
    expect(onClose).toHaveBeenCalledTimes(1)

    act(() => close!.click())
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
