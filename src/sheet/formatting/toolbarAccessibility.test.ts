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
        targetLabel: 'A1',
      }),
      createElement(CondFmtButtons, {
        col: 'A',
        ruleCount: 1,
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
    expect(document.querySelector('button[aria-label="A1 숫자 형식: 백분율 꺼짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 백분율 꺼짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 백분율 꺼짐"]')?.getAttribute('aria-pressed')).toBe('false')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 백분율 꺼짐"]')?.getAttribute('title')).toBe('A1 백분율 꺼짐 (Ctrl/⌘+Shift+5)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 백분율 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+5 Meta+Shift+5')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: USD 꺼짐"]')?.getAttribute('title')).toBe('A1 USD 꺼짐 (Ctrl/⌘+Shift+4)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: USD 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+4 Meta+Shift+4')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: epoch → 날짜 꺼짐"]')?.getAttribute('title')).toBe('A1 epoch → 날짜 꺼짐 (Ctrl/⌘+Shift+3)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: epoch → 날짜 꺼짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+3 Meta+Shift+3')
    expect(document.querySelector('button[aria-label="A1 숫자 형식: 일반 켜짐"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 일반 켜짐"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 일반 켜짐"]')?.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 일반 켜짐"]')?.getAttribute('title')).toBe('A1 일반 켜짐 (Ctrl/⌘+Shift+1)')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 일반 켜짐"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+1 Meta+Shift+1')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: EUR 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: EUR 꺼짐"]')?.getAttribute('title')).toBe('A1 EUR 꺼짐')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A1 숫자 형식: 정수 꺼짐"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector('button[aria-label="A열 조건부 서식 추가"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A열 조건부 서식 추가"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="A열 조건부 서식 추가"]')?.getAttribute('title')).toBe('A열 조건부 서식 추가')
    expect(document.querySelector('button[aria-label="조건부 서식 1개 모두 해제"]')).not.toBeNull()
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 1개 모두 해제"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="조건부 서식 1개 모두 해제"]')?.getAttribute('title')).toBe('조건부 서식 1개 모두 해제')
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

  it('hides style toggle shortcut hints when there is no target cell', () => {
    act(() => dom.root.render(createElement(StyleToggleButtons, {
      toggle: vi.fn(),
      styleOf: () => undefined,
      focusKey: null,
      targetLabel: '선택된 셀 없음',
      disabled: true,
    })))

    const bold = document.querySelector<HTMLButtonElement>('button[aria-label="굵게 적용할 셀 없음"]')
    const italic = document.querySelector<HTMLButtonElement>('button[aria-label="기울임 적용할 셀 없음"]')
    const underline = document.querySelector<HTMLButtonElement>('button[aria-label="밑줄 적용할 셀 없음"]')
    const strike = document.querySelector<HTMLButtonElement>('button[aria-label="취소선 적용할 셀 없음"]')
    const wrap = document.querySelector<HTMLButtonElement>('button[aria-label="텍스트 줄바꿈할 셀 없음"]')
    const border = document.querySelector<HTMLButtonElement>('button[aria-label="셀 테두리 설정할 셀 없음"]')

    expect(bold?.disabled).toBe(true)
    expect(bold?.getAttribute('title')).toBe('굵게 적용할 셀 없음')
    expect(bold?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(bold?.hasAttribute('aria-pressed')).toBe(false)
    expect(italic?.getAttribute('title')).toBe('기울임 적용할 셀 없음')
    expect(italic?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(italic?.hasAttribute('aria-pressed')).toBe(false)
    expect(underline?.getAttribute('title')).toBe('밑줄 적용할 셀 없음')
    expect(underline?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(underline?.hasAttribute('aria-pressed')).toBe(false)
    expect(strike?.getAttribute('title')).toBe('취소선 적용할 셀 없음')
    expect(strike?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(strike?.hasAttribute('aria-pressed')).toBe(false)
    expect(wrap?.getAttribute('title')).toBe('텍스트 줄바꿈할 셀 없음')
    expect(wrap?.hasAttribute('aria-pressed')).toBe(false)
    expect(border?.getAttribute('title')).toBe('셀 테두리 설정할 셀 없음')
    expect(border?.hasAttribute('aria-pressed')).toBe(false)
  })

  it('hides number format shortcut hints when there is no target cell', () => {
    act(() => dom.root.render(createElement(FormatButtons, {
      apply: vi.fn(),
      current: 'plain',
      targetLabel: '선택된 셀 없음',
      disabled: true,
    })))

    const plain = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 일반 적용할 셀 없음"]')
    const percent = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: 백분율 적용할 셀 없음"]')
    const currency = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: USD 적용할 셀 없음"]')
    const date = document.querySelector<HTMLButtonElement>('button[aria-label="숫자 형식: epoch → 날짜 적용할 셀 없음"]')

    expect(plain?.disabled).toBe(true)
    expect(plain?.hasAttribute('aria-pressed')).toBe(false)
    expect(plain?.getAttribute('title')).toBe('일반 적용할 셀 없음')
    expect(plain?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(percent?.hasAttribute('aria-pressed')).toBe(false)
    expect(percent?.getAttribute('title')).toBe('백분율 적용할 셀 없음')
    expect(percent?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(currency?.hasAttribute('aria-pressed')).toBe(false)
    expect(currency?.getAttribute('title')).toBe('USD 적용할 셀 없음')
    expect(currency?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(date?.hasAttribute('aria-pressed')).toBe(false)
    expect(date?.getAttribute('title')).toBe('epoch → 날짜 적용할 셀 없음')
    expect(date?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })
})
