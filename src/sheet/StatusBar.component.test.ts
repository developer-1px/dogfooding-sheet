import { readFileSync } from 'node:fs'
import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { cellId, parseCellId } from './schema'
import { StatusBar } from './StatusBar'
import { setupReactDOM } from './test-utils'

describe('StatusBar component', () => {
  const dom = setupReactDOM()
  const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

  const footer = (): HTMLElement => {
    const el = document.querySelector<HTMLElement>('.status-bar')
    if (!el) throw new Error('status bar not rendered')
    return el
  }
  const metric = (prefix: string): HTMLElement | undefined =>
    [...footer().querySelectorAll<HTMLElement>('span')]
      .find((span) => span.textContent?.startsWith(prefix))

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
    expect(saveStatus?.hasAttribute('aria-busy')).toBe(false)
    expect(saveStatus?.hasAttribute('role')).toBe(false)
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
    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')
    expect(saveStatus?.textContent).toBe('저장 중')
    expect(saveStatus?.getAttribute('title')).toBe('변경 사항 저장 중')
    expect(saveStatus?.getAttribute('aria-label')).toBe('변경 사항 저장 중')
    expect(saveStatus?.getAttribute('aria-busy')).toBe('true')
    expect(saveStatus?.hasAttribute('role')).toBe(false)
    expect(footer().textContent).toContain('SUM: 30')
    expect(metric('COUNTA:')?.getAttribute('title')).toBe('선택 영역의 비어 있지 않은 셀 수')
    expect(metric('COUNTA:')?.getAttribute('aria-label')).toBe('선택 영역의 비어 있지 않은 셀 수: 2')
    expect(metric('SUM:')?.getAttribute('title')).toBe('선택 영역 숫자 값 합계')
    expect(metric('SUM:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 합계: 30')
    expect(metric('AVG:')?.getAttribute('title')).toBe('선택 영역 숫자 값 평균')
    expect(metric('AVG:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 평균: 15')
    expect(metric('MIN:')?.getAttribute('title')).toBe('선택 영역 숫자 값 최솟값')
    expect(metric('MIN:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 최솟값: 10')
    expect(metric('MAX:')?.getAttribute('title')).toBe('선택 영역 숫자 값 최댓값')
    expect(metric('MAX:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 최댓값: 20')
    expect(metric('COUNT:')?.getAttribute('title')).toBe('선택 영역 숫자 값 개수')
    expect(metric('COUNT:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 개수: 2')
    expect(metric('MEDIAN:')?.getAttribute('title')).toBe('선택 영역 숫자 값 중앙값')
    expect(metric('MEDIAN:')?.getAttribute('aria-label')).toBe('선택 영역 숫자 값 중앙값: 15')
  })

  it('keeps detailed metrics wrapping within the status bar', () => {
    expect(overlaysCss()).toMatch(
      /\.status-bar\s*\{\s*display: flex; flex-wrap: wrap; gap: var\(--sheet-space-1, 4px\) var\(--sheet-space-6, 16px\); align-items: center;/,
    )
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
    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')
    expect(saveStatus?.textContent).toBe('저장 대기')
    expect(saveStatus?.getAttribute('title')).toBe('자동 저장 대기 중')
    expect(saveStatus?.getAttribute('aria-label')).toBe('자동 저장 대기 중')
    expect(saveStatus?.hasAttribute('aria-busy')).toBe(false)
    expect(saveStatus?.hasAttribute('role')).toBe(false)
  })

  it('labels saved status even when there is no saved timestamp', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
      persistence: { status: 'saved', dirty: false, savedAt: null, error: null },
    })))

    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')

    expect(saveStatus?.textContent).toBe('저장됨')
    expect(saveStatus?.getAttribute('title')).toBe('저장됨')
    expect(saveStatus?.getAttribute('aria-label')).toBe('저장됨')
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
    expect(saveStatus?.hasAttribute('aria-busy')).toBe(false)
    expect(saveStatus?.getAttribute('role')).toBe('alert')
  })

  it('labels save failure status even when there is no failure reason', () => {
    act(() => dom.root.render(createElement(StatusBar, {
      selectedIds: [],
      focusId: cellId('A', 0),
      rowCount: 10,
      colCount: 10,
      display: () => '123',
      parseId: parseCellId,
      persistence: { status: 'error', dirty: true, savedAt: null, error: null },
    })))

    const saveStatus = document.querySelector<HTMLElement>('.persistence-status')

    expect(saveStatus?.textContent).toBe('저장 실패')
    expect(saveStatus?.getAttribute('title')).toBe('저장 실패')
    expect(saveStatus?.getAttribute('aria-label')).toBe('저장 실패')
    expect(saveStatus?.getAttribute('role')).toBe('alert')
  })
})
