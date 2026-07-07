import { act, createElement, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from './test-utils'
import { Toolbar } from './Toolbar'
import type { Sheet } from './schema'

vi.mock('./toolbarActions', () => ({
  applyCheckboxValidation: () => false,
  applyToolbarAutoSum: () => false,
  applyToolbarFormat: () => false,
  clearToolbarStyle: () => false,
  promptListValidation: () => Promise.resolve('cancelled'),
  promptToolbarFilter: () => Promise.resolve('cancelled'),
  setToolbarAlignment: () => false,
  setToolbarColor: () => false,
  toggleToolbarStyle: () => false,
}))

describe('Toolbar component', () => {
  const dom = setupReactDOM()

  const renderToolbar = (overrides: Partial<ComponentProps<typeof Toolbar>> = {}) => {
    const props: ComponentProps<typeof Toolbar> = {
      display: () => '1',
      writeCell: vi.fn(),
      writeCells: vi.fn(),
      writeCellRange: vi.fn(() => false),
      focusKey: 'B2',
      selectedIds: ['B2'],
      setFormat: vi.fn(),
      formatOf: () => 'plain',
      insertRow: vi.fn(),
      deleteRow: vi.fn(),
      insertCol: vi.fn(),
      deleteCol: vi.fn(),
      appendRows: vi.fn(),
      appendCols: vi.fn(),
      sortByCol: vi.fn(),
      updateStyle: vi.fn(),
      styleOf: () => undefined,
      freeze: { rows: 0, cols: 0 },
      toggleFreezeRows: vi.fn(),
      toggleFreezeCols: vi.fn(),
      setFreezeRows: vi.fn(),
      setFreezeCols: vi.fn(),
      filter: { col: 'B', text: 'needle' },
      applyFilter: vi.fn(),
      clearFilter: vi.fn(),
      hasHidden: true,
      showAll: vi.fn(),
      setListRule: vi.fn(),
      setCheckboxRule: vi.fn(),
      clearRule: vi.fn(),
      openHelp: vi.fn(),
      insertLink: vi.fn(),
      addCondRule: vi.fn(),
      clearCondRules: vi.fn(),
      sheet: {} as Sheet,
      previewSheetReplacement: () => null,
      applySheetReplacement: vi.fn(() => false),
      clearCellValues: vi.fn(() => false),
      ask: () => Promise.resolve(null),
      confirm: () => Promise.resolve(false),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: true,
      canRedo: true,
      showFormulas: false,
      toggleShowFormulas: vi.fn(),
      showGridlines: true,
      toggleShowGridlines: vi.fn(),
      clearAllFormats: vi.fn(() => false),
      mergeSelection: vi.fn(),
      rowCount: 10,
      colCount: 5,
      ...overrides,
    }

    act(() => dom.root.render(createElement('form', null, createElement(Toolbar, props))))
    return props
  }

  it('renders toolbar command buttons as non-submit controls', () => {
    renderToolbar()

    const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')]

    expect(buttons.length).toBeGreaterThan(20)
    expect(buttons.every((button) => button.type === 'button')).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.type).toBe('button')
    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')
    expect(filterButton?.type).toBe('button')
    expect(filterButton?.disabled).toBe(false)
    expect(filterButton?.getAttribute('title')).toBe('B열 필터 수정')
    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 오름차순 정렬"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="B열 내림차순 정렬"]')
    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(false)
    expect(sortAsc?.getAttribute('title')).toBe('B열 오름차순 정렬')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(false)
    expect(sortDesc?.getAttribute('title')).toBe('B열 내림차순 정렬')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('.overflow-trigger')?.type).toBe('button')

    const clearFormatButton = document.querySelector<HTMLButtonElement>('button[aria-label="서식 모두 해제"]')
    expect(clearFormatButton?.textContent).toBe('✕서식')
    expect(clearFormatButton?.disabled).toBe(false)
    expect(clearFormatButton?.getAttribute('title')).toBe('서식 모두 해제')
    expect(clearFormatButton?.getAttribute('aria-keyshortcuts')).toBe('Control+\\ Meta+\\')

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')
    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(false)
    expect(mergeButton?.getAttribute('title')).toBe('선택 셀 병합 / 병합 해제 (Alt+Shift+M)')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')
  })

  it('disables toolbar sort buttons without a focused column', () => {
    renderToolbar({ focusKey: null, filter: null })

    const sortAsc = document.querySelector<HTMLButtonElement>('button[aria-label="현재 열 오름차순 정렬"]')
    const sortDesc = document.querySelector<HTMLButtonElement>('button[aria-label="현재 열 내림차순 정렬"]')

    expect(sortAsc?.textContent).toBe('↑정렬')
    expect(sortAsc?.disabled).toBe(true)
    expect(sortAsc?.getAttribute('title')).toBe('현재 열 오름차순 정렬')
    expect(sortDesc?.textContent).toBe('↓정렬')
    expect(sortDesc?.disabled).toBe(true)
    expect(sortDesc?.getAttribute('title')).toBe('현재 열 내림차순 정렬')
  })

  it('disables toolbar filter setup without a focused column but keeps clearing available', () => {
    renderToolbar({ focusKey: null, selectedIds: [], filter: { col: 'B', text: 'needle' } })

    const filterButton = document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')
    const clearFilter = document.querySelector<HTMLButtonElement>('button[aria-label="필터 해제"]')

    expect(filterButton?.textContent).toBe('🔽필터 B')
    expect(filterButton?.disabled).toBe(true)
    expect(filterButton?.getAttribute('title')).toBe('B열 필터 수정')
    expect(filterButton?.getAttribute('aria-pressed')).toBe('true')
    expect(clearFilter?.disabled).toBe(false)
  })

  it('exposes structure shortcut hints without changing labels or wiring', () => {
    const props = renderToolbar()

    const insertRow = document.querySelector<HTMLButtonElement>('button[aria-label="2행 위에 행 삽입"]')
    const deleteRow = document.querySelector<HTMLButtonElement>('button[aria-label="2행 삭제"]')
    const insertCol = document.querySelector<HTMLButtonElement>('button[aria-label="B열 왼쪽에 열 삽입"]')
    const deleteCol = document.querySelector<HTMLButtonElement>('button[aria-label="B열 삭제"]')
    const showAll = document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]')

    expect(insertRow?.textContent).toBe('+행')
    expect(insertRow?.getAttribute('title')).toBe('2행 위에 행 삽입 (Ctrl/⌘+Alt+=)')
    expect(insertRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+= Meta+Alt+=')
    expect(deleteRow?.textContent).toBe('−행')
    expect(deleteRow?.getAttribute('title')).toBe('2행 삭제 (Ctrl/⌘+Alt+-)')
    expect(deleteRow?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+- Meta+Alt+-')

    expect(insertCol?.textContent).toBe('+열')
    expect(insertCol?.getAttribute('title')).toBe('B열 왼쪽에 열 삽입 (Ctrl/⌘+Alt+Shift+=)')
    expect(insertCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+= Meta+Alt+Shift+=')
    expect(deleteCol?.textContent).toBe('−열')
    expect(deleteCol?.getAttribute('title')).toBe('B열 삭제 (Ctrl/⌘+Alt+Shift+-)')
    expect(deleteCol?.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+Shift+- Meta+Alt+Shift+-')

    expect(showAll?.textContent).toBe('👁모두표시')
    expect(showAll?.getAttribute('title')).toBe('숨김 행/열 모두 표시 (Ctrl/⌘+Shift+0)')
    expect(showAll?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+0 Meta+Shift+0')

    act(() => insertRow!.click())
    act(() => deleteRow!.click())
    act(() => insertCol!.click())
    act(() => deleteCol!.click())
    act(() => showAll!.click())

    expect(props.insertRow).toHaveBeenCalledWith(1)
    expect(props.deleteRow).toHaveBeenCalledWith(1)
    expect(props.insertCol).toHaveBeenCalledWith('B')
    expect(props.deleteCol).toHaveBeenCalledWith('B')
    expect(props.showAll).toHaveBeenCalledTimes(1)
  })
})
