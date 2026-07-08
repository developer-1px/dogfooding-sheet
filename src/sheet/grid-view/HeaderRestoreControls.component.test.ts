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
    const onGridKeyDown = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: onGridKeyDown },
      createElement(GridHeader, {
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
      }),
    )))

    const headerRow = document.querySelector<HTMLElement>('.header-row')
    const corner = document.querySelector<HTMLElement>('.corner-cell')

    expect(headerRow?.getAttribute('aria-rowindex')).toBe('1')
    expect(corner?.getAttribute('role')).toBe('columnheader')
    expect(corner?.getAttribute('aria-colindex')).toBe('1')
    expect(corner?.getAttribute('aria-label')).toBe('전체 시트 선택')
    expect(corner?.getAttribute('aria-keyshortcuts')).toBe('Enter Space')
    expect(corner?.getAttribute('title')).toBe('전체 시트 선택')
    expect(corner?.tabIndex).toBe(0)

    act(() => corner!.click())
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r0-A', 'r0-B', 'r1-A', 'r1-B'])
    expect(setFocusId).toHaveBeenLastCalledWith('r0-A')
    expect(setSelectAnchor).toHaveBeenLastCalledWith('r0-A')

    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    act(() => corner!.dispatchEvent(enter))
    expect(enter.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(2)

    const space = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    act(() => corner!.dispatchEvent(space))
    expect(space.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(3)
  })

  it('exposes selected state on the select-all corner header label', () => {
    act(() => dom.root.render(createElement(GridHeader, {
      gridTemplate: '40px 80px 80px',
      columnHeaderProps: () => ({ role: 'columnheader', tabIndex: 0 }),
      widthOf: () => 80,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      autoFitCol: vi.fn(),
      setSelectedIds: vi.fn(),
      setFocusId: vi.fn(),
      setSelectAnchor: vi.fn(),
      hiddenCols: new Set(),
      showCol: vi.fn(),
      filterCol: null,
      focusCol: null,
      selectedCols: new Set(),
      allSelected: true,
      onHeaderContextMenu: vi.fn(),
      rowCount: 2,
      colLetters: ['A', 'B'],
    })))

    const corner = document.querySelector<HTMLElement>('.corner-cell')

    expect(corner?.getAttribute('aria-label')).toBe('전체 시트 선택, 선택됨')
    expect(corner?.getAttribute('title')).toBe('전체 시트 선택, 선택됨')
    expect(corner?.getAttribute('aria-selected')).toBe('true')
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

  it('exposes filtered, selected, and current column state on the column header label', () => {
    act(() => dom.root.render(createElement(GridHeader, {
      gridTemplate: '40px 80px 80px',
      columnHeaderProps: () => ({ role: 'columnheader', tabIndex: 0 }),
      widthOf: () => 80,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      autoFitCol: vi.fn(),
      setSelectedIds: vi.fn(),
      setFocusId: vi.fn(),
      setSelectAnchor: vi.fn(),
      hiddenCols: new Set(),
      showCol: vi.fn(),
      filterCol: 'B',
      focusCol: 'B',
      selectedCols: new Set(['B']),
      allSelected: false,
      onHeaderContextMenu: vi.fn(),
      rowCount: 2,
      colLetters: ['A', 'B'],
    })))

    const unfiltered = document.querySelector<HTMLElement>('.header-cell[aria-label="A열"]')
    const filtered = document.querySelector<HTMLElement>('.header-cell.filtered')
    const filteredLabel = filtered?.querySelector<HTMLElement>('.header-cell-label')
    const filteredText = filtered?.querySelector<HTMLElement>('.header-cell-text')
    const filterMark = filtered?.querySelector<HTMLElement>('.filter-mark')

    expect(unfiltered?.getAttribute('aria-label')).toBe('A열')
    expect(unfiltered?.getAttribute('title')).toBe('A열 - 클릭=열 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 오른쪽 가장자리 드래그=너비 조정')
    expect(filtered?.getAttribute('aria-label')).toBe('B열, 필터 적용, 선택됨, 현재 위치')
    expect(filtered?.getAttribute('title')).toBe('B열, 필터 적용, 선택됨, 현재 위치 - 클릭=열 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 오른쪽 가장자리 드래그=너비 조정')
    expect(filtered?.getAttribute('aria-selected')).toBe('true')
    expect(filtered?.getAttribute('aria-current')).toBe('true')
    expect(filteredLabel?.textContent).toBe('B▾')
    expect(filteredText?.textContent).toBe('B')
    expect(filterMark?.textContent).toBe('▾')
    expect(filterMark?.getAttribute('aria-hidden')).toBe('true')
  })

  it('makes column headers keyboard-operable without stealing nested control keys', () => {
    const setSelectedIds = vi.fn()
    const setFocusId = vi.fn()
    const setSelectAnchor = vi.fn()
    const onResizeEnd = vi.fn()
    const onHeaderKeyDown = vi.fn()
    const onGridKeyDown = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: onGridKeyDown },
      createElement(GridHeader, {
        gridTemplate: '40px 80px 80px 80px',
        columnHeaderProps: () => ({ role: 'columnheader', tabIndex: 0, onKeyDown: onHeaderKeyDown }),
        widthOf: () => 80,
        onResize: vi.fn(),
        onResizeEnd,
        autoFitCol: vi.fn(),
        setSelectedIds,
        setFocusId,
        setSelectAnchor,
        hiddenCols: new Set(['A']),
        showCol: vi.fn(),
        filterCol: null,
        focusCol: 'A',
        selectedCols: new Set(),
        allSelected: false,
        onHeaderContextMenu: vi.fn(),
        rowCount: 2,
        colLetters: ['A', 'B', 'C'],
      }),
    )))

    const header = document.querySelector<HTMLElement>('.header-cell[aria-label="B열"]')
    const restore = document.querySelector<HTMLButtonElement>('.unhide-col.left')
    const resizer = header?.querySelector<HTMLElement>('.col-resizer')

    expect(header?.getAttribute('role')).toBe('columnheader')
    expect(header?.tabIndex).toBe(0)
    expect(header?.getAttribute('aria-keyshortcuts')).toBe('Enter Space')
    expect(header?.getAttribute('title')).toBe('B열 - 클릭=열 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 오른쪽 가장자리 드래그=너비 조정')
    expect(resizer?.getAttribute('aria-label')).toBe('B열 너비 조정, 현재 80px')
    expect(resizer?.getAttribute('title')).toBe('B열 너비 조정, 현재 80px / 드래그로 너비 조정 / ← → 키로 10px 조정 / Shift+← → 키로 50px 조정 / 더블클릭 자동 맞춤')
    expect(resizer?.getAttribute('aria-keyshortcuts')).toBe('ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight')
    expect(resizer?.getAttribute('aria-valuenow')).toBe('80')
    expect(resizer?.getAttribute('aria-valuetext')).toBe('80px')

    act(() => header!.click())
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r0-B', 'r1-B'])
    expect(setFocusId).toHaveBeenLastCalledWith('r0-B')
    expect(setSelectAnchor).toHaveBeenLastCalledWith('r0-B')

    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    act(() => header!.dispatchEvent(enter))
    expect(enter.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(2)

    const shiftSpace = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ', shiftKey: true })
    act(() => header!.dispatchEvent(shiftSpace))
    expect(shiftSpace.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r0-A', 'r1-A', 'r0-B', 'r1-B'])

    const arrowDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' })
    act(() => header!.dispatchEvent(arrowDown))
    expect(onHeaderKeyDown).toHaveBeenCalledTimes(1)
    expect(setSelectedIds).toHaveBeenCalledTimes(3)

    onGridKeyDown.mockClear()
    const nestedSpace = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    act(() => restore!.dispatchEvent(nestedSpace))
    expect(nestedSpace.defaultPrevented).toBe(false)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(3)

    onGridKeyDown.mockClear()
    const resizeArrow = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' })
    act(() => resizer!.dispatchEvent(resizeArrow))
    expect(onResizeEnd).toHaveBeenCalledTimes(1)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(3)
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

  it('exposes selected and current row state on the row header label', () => {
    act(() => dom.root.render(createElement(RowHeader, {
      rIdx: 2,
      focusId: null,
      setFocusId: vi.fn(),
      setSelectAnchor: vi.fn(),
      setSelectedIds: vi.fn(),
      heightOf: () => 24,
      onResize: vi.fn(),
      onResizeEnd: vi.fn(),
      resetRowHeight: vi.fn(),
      onContextMenu: vi.fn(),
      colLetters: ['A', 'B'],
      hiddenRows: new Set(),
      showRow: vi.fn(),
      selected: true,
      active: true,
    })))

    const header = document.querySelector<HTMLElement>('.row-header')
    const rowLabel = header?.querySelector<HTMLElement>('.row-header-label')

    expect(header?.getAttribute('aria-label')).toBe('3행, 선택됨, 현재 위치')
    expect(header?.getAttribute('title')).toBe('3행, 선택됨, 현재 위치 - 클릭=행 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 아래쪽 가장자리 드래그=높이 조정')
    expect(header?.getAttribute('aria-selected')).toBe('true')
    expect(header?.getAttribute('aria-current')).toBe('true')
    expect(rowLabel?.textContent).toBe('3')
  })

  it('makes row headers keyboard-operable without stealing nested control keys', () => {
    const setSelectedIds = vi.fn()
    const setFocusId = vi.fn()
    const setSelectAnchor = vi.fn()
    const onResizeEnd = vi.fn()
    const onGridKeyDown = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: onGridKeyDown },
      createElement(RowHeader, {
        rIdx: 2,
        focusId: 'r1-A',
        setFocusId,
        setSelectAnchor,
        setSelectedIds,
        heightOf: () => 24,
        onResize: vi.fn(),
        onResizeEnd,
        resetRowHeight: vi.fn(),
        onContextMenu: vi.fn(),
        colLetters: ['A', 'B'],
        hiddenRows: new Set([1]),
        showRow: vi.fn(),
        selected: false,
        active: false,
      }),
    )))

    const header = document.querySelector<HTMLElement>('.row-header')
    const restore = document.querySelector<HTMLButtonElement>('.unhide-row.top')
    const resizer = document.querySelector<HTMLElement>('.row-resizer')

    expect(header?.getAttribute('role')).toBe('rowheader')
    expect(header?.getAttribute('aria-rowindex')).toBe('4')
    expect(header?.getAttribute('aria-colindex')).toBe('1')
    expect(header?.getAttribute('aria-label')).toBe('3행')
    expect(header?.getAttribute('aria-keyshortcuts')).toBe('Enter Space')
    expect(header?.getAttribute('title')).toBe('3행 - 클릭=행 선택 / Shift+클릭=범위 / 우클릭=메뉴 / 아래쪽 가장자리 드래그=높이 조정')
    expect(header?.tabIndex).toBe(0)
    expect(resizer?.getAttribute('aria-label')).toBe('3행 높이 조정, 현재 24px')
    expect(resizer?.getAttribute('title')).toBe('3행 높이 조정, 현재 24px / 드래그=높이 조정 / ↑ ↓ 키로 10px 조정 / Shift+↑ ↓ 키로 50px 조정 / 더블클릭=기본값 복원')
    expect(resizer?.getAttribute('aria-keyshortcuts')).toBe('ArrowUp ArrowDown Shift+ArrowUp Shift+ArrowDown')
    expect(resizer?.getAttribute('aria-valuenow')).toBe('24')
    expect(resizer?.getAttribute('aria-valuetext')).toBe('24px')
    expect(resizer?.getAttribute('aria-valuemax')).toBe('1000')

    act(() => header!.click())
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r2-A', 'r2-B'])
    expect(setFocusId).toHaveBeenLastCalledWith('r2-A')
    expect(setSelectAnchor).toHaveBeenLastCalledWith('r2-A')

    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    act(() => header!.dispatchEvent(enter))
    expect(enter.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(2)

    const shiftSpace = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ', shiftKey: true })
    act(() => header!.dispatchEvent(shiftSpace))
    expect(shiftSpace.defaultPrevented).toBe(true)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenLastCalledWith(['r1-A', 'r1-B', 'r2-A', 'r2-B'])

    onGridKeyDown.mockClear()
    const nestedSpace = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    act(() => restore!.dispatchEvent(nestedSpace))
    expect(nestedSpace.defaultPrevented).toBe(false)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(3)

    onGridKeyDown.mockClear()
    const arrowDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' })
    act(() => resizer!.dispatchEvent(arrowDown))
    expect(onResizeEnd).toHaveBeenCalledTimes(1)
    expect(onGridKeyDown).not.toHaveBeenCalled()
    expect(setSelectedIds).toHaveBeenCalledTimes(3)
  })
})
