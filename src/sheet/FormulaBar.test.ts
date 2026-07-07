import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from './test-utils'
import { FormulaBar } from './FormulaBar'

describe('FormulaBar', () => {
  const dom = setupReactDOM()

  it('exposes accessible names for the address control and formula input', () => {
    act(() => dom.root.render(createElement(FormulaBar, {
      addr: 'B12',
      value: '=SUM(B2:B11)',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: true,
      canRedo: false,
      onAddrClick: vi.fn(),
    })))

    expect(document.querySelector('button.addr')?.getAttribute('aria-label')).toBe('B12 셀로 이동')
    expect(document.querySelector('input.formula')?.getAttribute('aria-label')).toBe('수식 입력줄')
    expect(document.querySelector('input.formula')?.getAttribute('aria-keyshortcuts')).toBe('Enter Escape F4')
    expect(document.querySelector('button[aria-label="실행 취소"]')?.textContent).toBe('실행 취소')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.type).toBe('button')
    expect(document.querySelector('button[aria-label="실행 취소"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Z Meta+Z')
    expect(document.querySelector('button[aria-label="다시 실행"]')?.textContent).toBe('다시 실행')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')?.type).toBe('button')
    expect(document.querySelector('button[aria-label="다시 실행"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+Z Meta+Shift+Z')
  })

  it('keeps the address control disabled when no jump action is available', () => {
    act(() => dom.root.render(createElement(FormulaBar, {
      addr: null,
      value: '',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
    })))

    const address = document.querySelector<HTMLButtonElement>('button.addr')
    expect(address?.disabled).toBe(true)
    expect(address?.getAttribute('aria-label')).toBe('셀 주소')
    expect(document.querySelector<HTMLInputElement>('input.formula')?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')?.type).toBe('button')
  })
})
