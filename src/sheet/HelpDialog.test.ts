import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from './test-utils'
import { HelpDialog } from './HelpDialog'

describe('HelpDialog', () => {
  const dom = setupReactDOM()

  it('documents shortcuts in a structured table', () => {
    act(() => dom.root.render(createElement(HelpDialog, {
      open: true,
      onClose: vi.fn(),
    })))

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

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="키보드 단축키 도움말 닫기"]')
    expect(close?.textContent).toBe('닫기')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')
  })
})
