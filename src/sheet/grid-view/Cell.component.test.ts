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

  it('keeps the pointer-only fill handle hidden from assistive technology', () => {
    const onFillHandleMouseDown = vi.fn()

    renderCell({
      isFillCorner: true,
      onFillHandleMouseDown,
      note: 'Needs review',
      validationOptions: ['Open', 'Closed'],
    })

    const fillHandle = document.querySelector<HTMLElement>('.fill-handle')
    const noteMark = document.querySelector<HTMLElement>('.note-mark')
    const dropdownMark = document.querySelector<HTMLElement>('.dropdown-mark')

    expect(fillHandle).not.toBeNull()
    expect(fillHandle?.getAttribute('aria-hidden')).toBe('true')
    expect(noteMark?.getAttribute('aria-hidden')).toBe('true')
    expect(dropdownMark?.getAttribute('aria-hidden')).toBe('true')

    act(() => fillHandle!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })))

    expect(onFillHandleMouseDown).toHaveBeenCalledTimes(1)

    renderCell({ isFillCorner: true, editing: true })

    expect(document.querySelector('.fill-handle')).toBeNull()
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

  it('keeps validation select keyboard events inside the select control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()
    const selectKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      editing: true,
      label: 'Open',
      draft: 'Open',
      validationOptions: ['Open', 'Closed'],
      selectProps: { value: 'Open', onChange: vi.fn(), onKeyDown: selectKeyDown },
    })

    const select = document.querySelector<HTMLSelectElement>('select.cell-input')

    expect(select?.getAttribute('aria-label')).toBe('A1 편집')
    expect([...select!.querySelectorAll('option')].map((option) => option.value)).toEqual(['', 'Open', 'Closed'])

    act(() => select!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))

    expect(selectKeyDown).toHaveBeenCalledTimes(1)
    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()
  })

  it('keeps wrapped textarea editor keyboard events inside the editor control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()
    const inputKeyDown = vi.fn()
    const formulaPickKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      editing: true,
      label: 'wrapped',
      draft: 'wrapped',
      styleClass: 'wrap',
      inputProps: { value: 'wrapped', onChange: vi.fn(), onKeyDown: inputKeyDown },
      onFormulaPickKeyDown: formulaPickKeyDown,
    })

    const textarea = document.querySelector<HTMLTextAreaElement>('textarea.cell-input')

    expect(textarea?.getAttribute('aria-label')).toBe('A1 편집')
    expect(textarea?.value).toBe('wrapped')

    act(() => textarea!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))

    expect(formulaPickKeyDown).toHaveBeenCalledTimes(1)
    expect(inputKeyDown).toHaveBeenCalledTimes(1)
    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()
  })

  it('keeps contenteditable editor keyboard events inside the editor control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()
    const formulaPickKeyDown = vi.fn()

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      editing: true,
      label: 'plain',
      draft: 'plain',
      onFormulaPickKeyDown: formulaPickKeyDown,
    })

    const editor = document.querySelector<HTMLElement>('[data-nano-inline-edit="true"]')

    expect(editor?.className).toBe('cell-input')
    expect(editor?.getAttribute('aria-label')).toBe('A1 편집')

    act(() => editor!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })))

    expect(formulaPickKeyDown).toHaveBeenCalledTimes(1)
    expect(contextKeyDown).not.toHaveBeenCalled()
    expect(gridKeyDown).not.toHaveBeenCalled()
  })

  it('keeps default-prevented contenteditable editor keys inside the editor control', () => {
    const gridKeyDown = vi.fn()
    const contextKeyDown = vi.fn()
    const formulaPickKeyDown = vi.fn((event: KeyboardEvent) => event.preventDefault())

    renderCell({
      cellProps: { role: 'gridcell', tabIndex: 0, onKeyDown: gridKeyDown },
      ctxHandlers: { onContextMenu: vi.fn(), onKeyDown: contextKeyDown },
      editing: true,
      label: '=A1',
      draft: '=A1',
      onFormulaPickKeyDown: formulaPickKeyDown,
    })

    const editor = document.querySelector<HTMLElement>('[data-nano-inline-edit="true"]')

    expect(editor?.className).toContain('formula-input')

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
    act(() => editor!.dispatchEvent(event))

    expect(event.defaultPrevented).toBe(true)
    expect(formulaPickKeyDown).toHaveBeenCalledTimes(1)
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
