import { act, createElement, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { setupReactDOM } from '../test-utils'
import { Cell } from './Cell'

describe('Cell component', () => {
  const dom = setupReactDOM()

  const renderCell = (overrides: Partial<ComponentProps<typeof Cell>> = {}) => {
    const props: ComponentProps<typeof Cell> = {
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: vi.fn() },
      address: 'A1',
      label: 'TRUE',
      selected: false,
      focused: false,
      highlighted: false,
      isNum: false,
      editing: false,
      draft: '',
      setDraft: vi.fn(),
      onCommit: vi.fn(),
      onCancel: vi.fn(),
      onStartEdit: vi.fn(),
      onMouseDown: vi.fn(),
      onMouseEnter: vi.fn(),
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: vi.fn() },
      isFillCorner: false,
      previewing: false,
      onFormulaPickKeyDown: vi.fn(),
      onFillHandleMouseDown: vi.fn(),
      styleClass: '',
      styleInline: {},
      formulaReferenceText: [],
      inputProps: {},
      selectProps: {},
      ...overrides,
    }

    act(() => dom.root.render(createElement(Cell, props)))
    return props
  }

  it('keeps checkbox keyboard events inside the checkbox control', () => {
    const onCheckboxToggle = vi.fn()
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      isCheckbox: true,
      onCheckboxToggle,
    })

    const checkbox = document.querySelector<HTMLInputElement>('.cell-checkbox')

    expect(checkbox?.checked).toBe(true)
    expect(checkbox?.getAttribute('aria-label')).toBe('A1 TRUE')

    act(() => checkbox!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })))

    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()

    act(() => checkbox!.click())

    expect(onCheckboxToggle).toHaveBeenCalledTimes(1)
  })

  it('keeps URL link keyboard events inside the link control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      label: 'https://example.com',
    })

    const link = document.querySelector<HTMLAnchorElement>('.cell-link')

    expect(link?.textContent).toBe('https://example.com')
    expect(link?.getAttribute('href')).toBe('https://example.com/')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noreferrer noopener')

    act(() => link!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))

    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()
  })

  it('keeps email link keyboard events inside the link control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      label: 'person@example.com',
    })

    const link = document.querySelector<HTMLAnchorElement>('.cell-link')

    expect(link?.textContent).toBe('person@example.com')
    expect(link?.getAttribute('href')).toBe('mailto:person@example.com')
    expect(link?.hasAttribute('target')).toBe(false)

    act(() => link!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))

    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()
  })

  it('keeps non-checkbox cell keyboard handling on the parent gridcell', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      isCheckbox: false,
      label: 'plain',
    })

    const cell = document.querySelector<HTMLElement>('[role="gridcell"]')

    act(() => cell!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))

    expect(contextKeyDown).toHaveBeenCalledTimes(1)
    expect(gridKeyDown).toHaveBeenCalledTimes(1)
  })
})
