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
      persistence: { status: 'saved', dirty: false, savedAt: '2026-07-08T06:30:00.000Z', error: null },
    })))

    expect(footer().getAttribute('role')).toBe('status')
    expect(footer().getAttribute('aria-label')).toBe('상태 표시줄')
    expect(footer().getAttribute('aria-live')).toBe('polite')
    expect(footer().getAttribute('aria-atomic')).toBe('true')
    expect(footer().textContent).toContain('1 셀')
    expect(footer().textContent).toContain('저장됨')
    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')
    expect(saveStatus?.textContent).toBe('저장됨')
    expect(saveStatus?.getAttribute('title')).toBe('마지막 저장: 2026-07-08T06:30:00.000Z')
    expect(saveStatus?.getAttribute('aria-label')).toBe('마지막 저장: 2026-07-08T06:30:00.000Z')
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

  it('keeps save failure text terse while exposing the failure reason', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
      persistence: { status: 'error', dirty: true, savedAt: null, error: 'Quota exceeded' },
    })))

    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')

    expect(footer().getAttribute('role')).toBe('status')
    expect(footer().getAttribute('aria-live')).toBe('polite')
    expect(saveStatus?.textContent).toBe('저장 실패')
    expect(saveStatus?.getAttribute('title')).toBe('저장 실패: Quota exceeded')
    expect(saveStatus?.getAttribute('aria-label')).toBe('저장 실패: Quota exceeded')
  })
})
