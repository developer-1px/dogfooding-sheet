import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from '../test-utils'
import { GridHeader } from './GridHeader'
import { RowHeader } from './RowHeader'

describe('header restore controls', () => {
  const dom = setupReactDOM()

  it('makes the select-all corner header keyboard-operable', () => {
    const setSelectedIds = vi.fn()
    const setFocusId = vi.fn()
    const setSelectAnchor = vi.fn()

    act(() => dom.root.render(createElement(GridHeader, {
      gridTemplate: '40px 80px 80px',
      columnHeaderProps: () => ({ role: 'columnheader', tabIndex: 0 }),
      widthOf: () => 80,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      autoFitCol: vi.fn(),
      setSelectedIds,
      setFocusId,
      setSelectAnchor,
      hiddenCols: new Set(),
      showCol: vi.fn(),
      filterCol: null,
      focusCol: null,
      selectedCols: new Set(),
      allSelected: false,
      onHeaderContextMenu: vi.fn(),
      rowCount: 2,
      colLetters: ['A', 'B'],
    })))

    const corner = document.querySelector<HTMLElement>('.corner-cell')

    expect(corner?.getAttribute('role')).toBe('columnheader')
    expect(corner?.getAttribute('aria-label')).toBe('전체 시트 선택')
    expect(corner?.tabIndex).toBe(0)

    act(() => corner!.click())
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
    expect(setFocusId).toHaveBeenLastCalledWith('r0-A')
    expect(setSelectAnchor).toHaveBeenLastCalledWith('r0-A')

    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    act(() => corner!.dispatchEvent(enter))
    expect(enter.defaultPrevented).toBe(true)
    expect(setSelectedIds).toHaveBeenCalledTimes(2)

    const space = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    act(() => corner!.dispatchEvent(space))
    expect(space.defaultPrevented).toBe(true)
    expect(setSelectedIds).toHaveBeenCalledTimes(3)
  })

  it('renders column restore controls as non-submit buttons', () => {
    const showCol = vi.fn()
    const setSelectedIds = vi.fn()

    act(() => dom.root.render(createElement(GridHeader, {
      gridTemplate: '40px 80px 80px 80px',
      columnHeaderProps: () => ({ role: 'columnheader', tabIndex: 0 }),
      widthOf: () => 80,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      autoFitCol: vi.fn(),
      setSelectedIds,
      setFocusId: vi.fn(),
      setSelectAnchor: vi.fn(),
      hiddenCols: new Set(['A', 'C']),
      showCol,
      filterCol: null,
      focusCol: null,
      selectedCols: new Set(),
      allSelected: false,
      onHeaderContextMenu: vi.fn(),
      rowCount: 4,
      colLetters: ['A', 'B', 'C'],
    })))

    const left = document.querySelector<HTMLButtonElement>('.unhide-col.left')
    const right = document.querySelector<HTMLButtonElement>('.unhide-col.right')

    expect(left?.type).toBe('button')
    expect(left?.textContent).toBe('‹')
    expect(left?.getAttribute('aria-label')).toBe('A열 숨김 표시')
    expect(right?.type).toBe('button')
    expect(right?.textContent).toBe('›')
    expect(right?.getAttribute('aria-label')).toBe('C열 숨김 표시')

    act(() => left!.click())
    act(() => right!.click())

    expect(showCol).toHaveBeenNthCalledWith(1, 'A')
    expect(showCol).toHaveBeenNthCalledWith(2, 'C')
    expect(setSelectedIds).not.toHaveBeenCalled()
  })

  it('renders row restore controls as non-submit buttons', () => {
    const showRow = vi.fn()
    const setSelectedIds = vi.fn()

    act(() => dom.root.render(createElement(RowHeader, {
      rIdx: 2,
      focusId: null,
      setFocusId: vi.fn(),
      setSelectAnchor: vi.fn(),
      setSelectedIds,
      heightOf: () => 24,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      resetRowHeight: vi.fn(),
      onContextMenu: vi.fn(),
      colLetters: ['A', 'B'],
      hiddenRows: new Set([1, 3]),
      showRow,
      selected: false,
      active: false,
    })))

    const top = document.querySelector<HTMLButtonElement>('.unhide-row.top')
    const bottom = document.querySelector<HTMLButtonElement>('.unhide-row.bottom')

    expect(top?.type).toBe('button')
    expect(top?.textContent).toBe('⌃')
    expect(top?.getAttribute('aria-label')).toBe('2행 숨김 표시')
    expect(bottom?.type).toBe('button')
    expect(bottom?.textContent).toBe('⌄')
    expect(bottom?.getAttribute('aria-label')).toBe('4행 숨김 표시')

    act(() => top!.click())
    act(() => bottom!.click())

    expect(showRow).toHaveBeenNthCalledWith(1, 1)
    expect(showRow).toHaveBeenNthCalledWith(2, 3)
    expect(setSelectedIds).not.toHaveBeenCalled()
  })
})
