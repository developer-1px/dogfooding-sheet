import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, press, setInputValue, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const typeKey = (key: string) => {
  const inp = document.querySelector<HTMLInputElement>('input.cell-input')
  if (inp) {
    keyDown(inp, key)
    if (key === 'Enter' || key === 'Escape' || key === 'Tab') return
    if (key.length === 1) setInputValue(inp, inp.value + key)
    return
  }
  press(key)
}

describe('spreadsheet preview interactions', () => {
  it('labels grid cells with address, value, and selection state', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const renderedCells = gridCells()
    expect(renderedCells[0].getAttribute('aria-label')).toBe('A1 Item 현재 셀')
    expect(renderedCells[0].getAttribute('aria-current')).toBe('true')
    expect(renderedCells[0].getAttribute('aria-selected')).toBe('false')

    const a5 = renderedCells[40]
    act(() => mouseClick(a5))

    expect(a5.getAttribute('aria-label')).toBe('A5 빈 셀 선택됨 현재 셀')
    expect(a5.getAttribute('aria-current')).toBe('true')
    expect(a5.getAttribute('aria-selected')).toBe('true')
  })

  it('marks error cells as invalid', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const a5 = gridCells()[40]
    act(() => mouseClick(a5))
    for (const key of '#N/A') act(() => typeKey(key))
    act(() => typeKey('Enter'))

    expect(a5.getAttribute('aria-invalid')).toBe('true')
    expect(a5.getAttribute('aria-label')).toContain('오류')
  })

  it('labels the active cell editor with its cell address', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const a1 = gridCells()[0]
    act(() => mouseClick(a1))
    act(() => keyDown(a1, 'F2'))

    const editor = document.querySelector<HTMLInputElement>('input.cell-input')
    expect(a1.getAttribute('aria-label')).toBe('A1 Item 선택됨 현재 셀 편집 중')
    expect(editor?.getAttribute('aria-label')).toBe('A1 편집')
  })

  it('exposes merged cells with range and span metadata', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight', { shiftKey: true }))
    act(() => keyDown(document.querySelector<HTMLElement>('.cell.focused')!, 'ArrowRight', { shiftKey: true }))
    act(() => press('m', { altKey: true, shiftKey: true }))

    const merged = document.querySelector<HTMLElement>('.cell.merged')
    expect(merged?.getAttribute('aria-label')).toContain('병합 셀 A1:C1')
    expect(merged?.getAttribute('aria-colspan')).toBe('3')
  })

  it('commits text typed directly after selecting an empty cell with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const a5 = gridCells()[40]

    expect(a5).not.toBeUndefined()

    act(() => mouseClick(a5))
    for (const key of 'Hello') act(() => typeKey(key))
    act(() => typeKey('Enter'))

    expect(a5.textContent).toContain('Hello')
  })
})
