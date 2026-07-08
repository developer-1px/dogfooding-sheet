import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PatternData } from '@interactive-os/aria'
import { useSheetGrid } from './useSheetGrid'

describe('useSheetGrid', () => {
  let host: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  it('exposes a named grid root with sheet dimensions', () => {
    const data = gridData(2, ['A', 'B', 'C'])

    act(() => root.render(createElement(GridRootProbe, { data, rowCount: 2, colCount: 3 })))

    const grid = document.querySelector<HTMLElement>('[role="grid"]')

    expect(grid?.getAttribute('aria-label')).toBe('스프레드시트 그리드')
    expect(grid?.getAttribute('aria-rowcount')).toBe('3')
    expect(grid?.getAttribute('aria-colcount')).toBe('4')
    expect(grid?.getAttribute('aria-keyshortcuts')).toBe('ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Enter')
    expect(document.querySelector<HTMLElement>('[role="row"][data-row-id="r0"]')?.getAttribute('aria-rowindex')).toBe('2')
    expect(document.querySelector<HTMLElement>('[role="columnheader"][data-id="h-A"]')?.getAttribute('aria-colindex')).toBe('2')
    expect(document.querySelector<HTMLElement>('[role="gridcell"][data-id="r0-A"]')?.getAttribute('aria-colindex')).toBe('2')
  })

  it('keeps unmodified arrow keys routed through the grid pattern', () => {
    const data = gridData(1, ['A', 'B'])
    data.state = { ...data.state, activeKey: 'r0-A', anchorKey: 'r0-A' }
    const setFocusId = vi.fn()

    act(() => root.render(createElement(GridRootProbe, { data, rowCount: 1, colCount: 2, setFocusId })))

    const grid = document.querySelector<HTMLElement>('[role="grid"]')
    const arrowRight = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowRight' })

    act(() => grid!.dispatchEvent(arrowRight))

    expect(setFocusId).toHaveBeenLastCalledWith('r0-B')
  })
})

function GridRootProbe({
  data,
  rowCount,
  colCount,
  setFocusId = vi.fn(),
}: {
  data: PatternData
  rowCount: number
  colCount: number
  setFocusId?: (id: string) => void
}) {
  const { rootProps, rowProps, columnHeaderProps, cellProps } = useSheetGrid({
    data,
    rowCount,
    colCount,
    setFocusId,
    setSelectedIds: vi.fn(),
    setSelectAnchor: vi.fn(),
  })
  return createElement('div', rootProps,
    createElement('span', columnHeaderProps('h-A'), 'A'),
    createElement('div', rowProps('r0'),
      createElement('span', cellProps('r0-A'), 'A1'),
    ),
  )
}

function gridData(rowCount: number, colLetters: readonly string[]): PatternData {
  const items: PatternData['items'] = { header: { label: 'Columns', kind: 'row' } }
  const rowKeys = ['header']
  const columnKeys = colLetters.map((col) => `c-${col}`)
  const cells: NonNullable<NonNullable<PatternData['relations']>['cells']>[number][] = []
  const rowIndexByKey: Record<string, number> = { header: 1 }
  const columnIndexByKey: Record<string, number> = {}
  const valueByKey: Record<string, string> = {}
  const editableKeys: string[] = []

  colLetters.forEach((col, index) => {
    const columnKey = columnKeys[index]!
    const headerId = `h-${col}`
    items[columnKey] = { label: col, kind: 'column' }
    items[headerId] = { label: col, kind: 'columnheader' }
    cells.push({ rowKey: 'header', columnKey, cellKey: headerId })
    rowIndexByKey[headerId] = 1
    columnIndexByKey[headerId] = index + 1
  })

  for (let row = 0; row < rowCount; row++) {
    const rowId = `r${row}`
    rowKeys.push(rowId)
    items[rowId] = { label: String(row + 1), kind: 'row' }
    rowIndexByKey[rowId] = row + 2
    colLetters.forEach((col, index) => {
      const columnKey = columnKeys[index]!
      const cellId = `r${row}-${col}`
      items[cellId] = { label: '', kind: 'gridcell' }
      cells.push({ rowKey: rowId, columnKey, cellKey: cellId })
      rowIndexByKey[cellId] = row + 2
      columnIndexByKey[cellId] = index + 1
      valueByKey[cellId] = ''
      editableKeys.push(cellId)
    })
  }

  return {
    items,
    relations: { rowKeys, columnKeys, cells },
    state: {
      rowCount: rowCount + 1,
      colCount: colLetters.length,
      rowIndexByKey,
      columnIndexByKey,
      valueByKey,
      editableKeys,
    },
    refs: { label: 'Spreadsheet' },
  }
}
