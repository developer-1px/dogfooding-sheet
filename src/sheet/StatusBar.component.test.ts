import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { cellId, parseCellId } from './schema'
import { StatusBar } from './StatusBar'
import { setupReactDOM } from './test-utils'

describe('StatusBar component', () => {
  const dom = setupReactDOM()

  const footer = (): HTMLElement => {
    const el = document.querySelector<HTMLElement>('.status-bar')
    if (!el) throw new Error('status bar not rendered')
    return el
  }

  it('marks terse status updates as atomic live-region updates', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
      persistence: { status: 'saved', dirty: false },
    })))

    expect(footer().getAttribute('role')).toBe('status')
    expect(footer().getAttribute('aria-label')).toBe('상태 표시줄')
    expect(footer().getAttribute('aria-live')).toBe('polite')
    expect(footer().getAttribute('aria-atomic')).toBe('true')
    expect(footer().textContent).toContain('1 셀')
    expect(footer().textContent).toContain('저장됨')
  })

  it('marks detailed aggregate updates as atomic live-region updates', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [cellId('A', 0), cellId('A', 1)],
      focusId: null,
      rowCount: 10,
      colCount: 10,
      display: (key) => key === 'A1' ? '10' : '20',
      parseId: parseCellId,
      persistence: { status: 'saving', dirty: true },
    })))

    expect(footer().getAttribute('role')).toBe('status')
    expect(footer().getAttribute('aria-label')).toBe('상태 표시줄')
    expect(footer().getAttribute('aria-live')).toBe('polite')
    expect(footer().getAttribute('aria-atomic')).toBe('true')
    expect(footer().textContent).toContain('2 셀 (2행 × 1열)')
    expect(footer().textContent).toContain('저장 중')
    expect(footer().textContent).toContain('SUM: 30')
  })

  it('distinguishes pending autosave from active saving', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
      persistence: { status: 'pending', dirty: true, savedAt: null, error: null },
    })))

    expect(footer().getAttribute('role')).toBe('status')
    expect(footer().getAttribute('aria-live')).toBe('polite')
    expect(footer().getAttribute('aria-atomic')).toBe('true')
    expect(footer().textContent).toContain('저장 대기')
    expect(footer().textContent).not.toContain('저장 중')
  })
})
