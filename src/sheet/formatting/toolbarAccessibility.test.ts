import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from '../test-utils'
import { CondFmtButtons } from './CondFmtButtons'
import { FormatButtons } from './FormatButtons'
import { StyleToggleButtons } from './StyleToggleButtons'

describe('toolbar formatting controls', () => {
  const dom = setupReactDOM()

  it('exposes stable accessible names for compact buttons', () => {
    act(() => dom.root.render(createElement('div', null,
      createElement(StyleToggleButtons, {
        toggle: vi.fn(),
        styleOf: () => undefined,
        focusKey: 'A1',
      }),
      createElement(FormatButtons, {
        apply: vi.fn(),
        current: 'plain',
      }),
      createElement(CondFmtButtons, {
        col: 'A',
        hasRules: true,
        addCondRule: vi.fn(),
        clearCondRules: vi.fn(),
        ask: () => Promise.resolve(null),
      }),
    )))

    expect(document.querySelector('button[aria-label="굵게"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')?.getAttribute('title')).toBe('굵게 (Ctrl/⌘+B)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="굵게"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="기울임"]')?.getAttribute('title')).toBe('기울임 (Ctrl/⌘+I)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="기울임"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+I Meta+I')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="밑줄"]')?.getAttribute('title')).toBe('밑줄 (Ctrl/⌘+U)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="밑줄"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+U Meta+U')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="취소선"]')?.getAttribute('title')).toBe('취소선 (Alt+Shift+5)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="취소선"]')?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+5')
    expect(document.querySelector('button[aria-label="텍스트 줄바꿈"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="텍스트 줄바꿈"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="텍스트 줄바꿈"]')?.getAttribute('title')).toBe('텍스트 줄바꿈')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="텍스트 줄바꿈"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="셀 테두리"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector('button[aria-label="숫자 형식: 백분율"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율"]')?.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율"]')?.getAttribute('title')).toBe('백분율 (Ctrl/⌘+Shift+5)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+5 Meta+Shift+5')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: USD"]')?.getAttribute('title')).toBe('USD (Ctrl/⌘+Shift+4)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: USD"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+4 Meta+Shift+4')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: epoch → 날짜"]')?.getAttribute('title')).toBe('epoch → 날짜 (Ctrl/⌘+Shift+3)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: epoch → 날짜"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+3 Meta+Shift+3')
    expect(document.querySelector('button[aria-label="숫자 형식: 일반"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.getAttribute('title')).toBe('일반 (Ctrl/⌘+Shift+1)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+1 Meta+Shift+1')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: EUR"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: EUR"]')?.getAttribute('title')).toBe('EUR')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 정수"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector('button[aria-label="조건부 서식 추가"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 추가"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 추가"]')?.getAttribute('title')).toBe('조건부 서식 추가')
    expect(document.querySelector('button[aria-label="조건부 서식 모두 해제"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.getAttribute('title')).toBe('조건부 서식 모두 해제')
  })
})
