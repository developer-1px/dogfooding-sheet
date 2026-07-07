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
        addCondRule: vi.fn(),
        clearCondRules: vi.fn(),
        ask: () => Promise.resolve(null),
      }),
    )))

    expect(document.querySelector('button[aria-label="굵게"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="텍스트 줄바꿈"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="숫자 형식: 백분율"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="숫자 형식: 일반"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="조건부 서식 추가"]')).not.toBeNull()
    expect(document.querySelector('button[aria-label="조건부 서식 모두 해제"]')).not.toBeNull()
  })
})
