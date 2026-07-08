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
        targetLabel: 'A1',
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

    expect(document.querySelector('button[aria-label="A1 굵게 꺼짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 굵게 꺼짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 굵게 꺼짐"]')?.getAttribute('title')).toBe('A1 굵게 꺼짐 (Ctrl/⌘+B)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 굵게 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+B Meta+B')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 기울임 꺼짐"]')?.getAttribute('title')).toBe('A1 기울임 꺼짐 (Ctrl/⌘+I)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 기울임 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+I Meta+I')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 밑줄 꺼짐"]')?.getAttribute('title')).toBe('A1 밑줄 꺼짐 (Ctrl/⌘+U)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 밑줄 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+U Meta+U')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 취소선 꺼짐"]')?.getAttribute('title')).toBe('A1 취소선 꺼짐 (Alt+Shift+5)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 취소선 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+5')
    expect(document.querySelector('button[aria-label="A1 텍스트 줄바꿈 꺼짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 텍스트 줄바꿈 꺼짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 텍스트 줄바꿈 꺼짐"]')?.getAttribute('title')).toBe('A1 텍스트 줄바꿈 꺼짐')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 텍스트 줄바꿈 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 셀 테두리 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector('button[aria-label="숫자 형식: 백분율 꺼짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 꺼짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 꺼짐"]')?.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 꺼짐"]')?.getAttribute('title')).toBe('백분율 꺼짐 (Ctrl/⌘+Shift+5)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+5 Meta+Shift+5')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: USD 꺼짐"]')?.getAttribute('title')).toBe('USD 꺼짐 (Ctrl/⌘+Shift+4)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: USD 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+4 Meta+Shift+4')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: epoch → 날짜 꺼짐"]')?.getAttribute('title')).toBe('epoch → 날짜 꺼짐 (Ctrl/⌘+Shift+3)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: epoch → 날짜 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+3 Meta+Shift+3')
    expect(document.querySelector('button[aria-label="숫자 형식: 일반 켜짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.getAttribute('title')).toBe('일반 켜짐 (Ctrl/⌘+Shift+1)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 켜짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+1 Meta+Shift+1')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: EUR 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: EUR 꺼짐"]')?.getAttribute('title')).toBe('EUR 꺼짐')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 정수 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector('button[aria-label="A열 조건부 서식 추가"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A열 조건부 서식 추가"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A열 조건부 서식 추가"]')?.getAttribute('title')).toBe('A열 조건부 서식 추가')
    expect(document.querySelector('button[aria-label="조건부 서식 모두 해제"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 모두 해제"]')?.getAttribute('title')).toBe('조건부 서식 모두 해제')
  })

  it('includes on state in style toggle labels and titles', () => {
    act(() => dom.root.render(createElement(StyleToggleButtons, {
      toggle: vi.fn(),
      styleOf: () => ({ b: true, w: true }),
      focusKey: 'A1',
      targetLabel: 'A1',
    })))

    const bold = document.querySelector<HTMLButtonElement>('button[aria-label="A1 굵게 켜짐"]')
    const wrap = document.querySelector<HTMLButtonElement>('button[aria-label="A1 텍스트 줄바꿈 켜짐"]')

    expect(bold?.textContent).toBe('B')
    expect(bold?.getAttribute('aria-pressed')).toBe('true')
    expect(bold?.getAttribute('title')).toBe('A1 굵게 켜짐 (Ctrl/⌘+B)')
    expect(wrap?.textContent).toBe('↵줄')
    expect(wrap?.getAttribute('aria-pressed')).toBe('true')
    expect(wrap?.getAttribute('title')).toBe('A1 텍스트 줄바꿈 켜짐')
  })
})
