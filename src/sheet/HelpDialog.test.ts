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
    expect([...document.querySelectorAll('th')].map((th) => th.textContent)).toEqual(['단축키', '동작'])
    expect([...document.querySelectorAll('th')].every((th) => th.getAttribute('scope') === 'col')).toBe(true)
    expect(document.querySelector('kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    expect(document.querySelector('tbody tr td:first-child kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    expect(document.body.textContent).toContain('F4 (수식 입력 중)')
    expect(document.body.textContent).toContain('마지막 셀 참조의 절대/상대 형식 순환')

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="키보드 단축키 도움말 닫기"]')
    expect(close?.textContent).toBe('닫기')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')
  })
})
