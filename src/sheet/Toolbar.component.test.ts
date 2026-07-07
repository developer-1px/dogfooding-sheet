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
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="B열 필터 수정"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="숨김 행과 열 모두 표시"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('.overflow-trigger')?.type).toBe('button')

    const mergeButton = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 병합 또는 병합 해제"]')
    expect(mergeButton?.textContent).toBe('⊞병합')
    expect(mergeButton?.disabled).toBe(false)
    expect(mergeButton?.getAttribute('title')).toBe('선택 셀 병합 / 병합 해제 (Alt+Shift+M)')
    expect(mergeButton?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')
  })
})
