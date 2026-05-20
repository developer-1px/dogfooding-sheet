import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cellByText, cells as gridCells, mouseClick as click, press, setInputValue, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

describe('surgical key-path undo (zod-crud audit fix)', () => {
  it('bolding two cells then one undo only un-bolds the second', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const apple = cellByText('Apple')!
    const bread = cellByText('Bread')!
    expect(apple).toBeDefined()
    expect(bread).toBeDefined()

    act(() => click(apple))
    act(() => press('b', { ctrlKey: true }))
    expect(apple.className).toContain('bold')

    act(() => click(bread))
    act(() => press('b', { ctrlKey: true }))
    expect(bread.className).toContain('bold')

    // Single undo should revert ONLY the most recent bold (Bread), leaving Apple bold.
    act(() => press('z', { ctrlKey: true }))
    expect(bread.className).not.toContain('bold')
    expect(apple.className, 'Apple bold should survive — surgical /styles/<key> patch').toContain('bold')
  })

  it('formula evaluation result is shown in cell (sanity check)', async () => {
    await act(async () => dom.root.render(createElement(App)))
    // initialSheet has D2 = '=B2*C2' where B2=3, C2=1.50 → 4.5 (formatted '4.5')
    const d2 = cellByText('4.5')
    expect(d2, '=B2*C2 should compute to 4.5 (3 × 1.50)').toBeDefined()
  })

  it('Cmd+X (cut) on multi-cell selection is a single undo entry', async () => {
    await act(async () => dom.root.render(createElement(App)))
    const apple = cellByText('Apple')!; const milk = cellByText('Milk')!
    act(() => click(apple))
    act(() => click(milk, { shiftKey: true }))
    act(() => press('x', { ctrlKey: true }))
    expect(cellByText('Apple')).toBeUndefined()
    expect(cellByText('Milk')).toBeUndefined()
    act(() => press('z', { ctrlKey: true }))
    expect(cellByText('Apple')).toBeDefined()
    expect(cellByText('Milk')).toBeDefined()
  })

  it('Cmd+D fillDown across N cells is a single undo entry', async () => {
    await act(async () => dom.root.render(createElement(App)))
    const apple = cellByText('Apple')!; const milk = cellByText('Milk')!
    act(() => click(apple))
    act(() => click(milk, { shiftKey: true }))
    act(() => press('d', { ctrlKey: true }))
    expect(gridCells().filter((c) => c.textContent === 'Apple').length).toBe(3)
    act(() => press('z', { ctrlKey: true }))
    // Bread/Milk should be restored, Apple count back to 1
    expect(cellByText('Bread'), 'Bread should restore').toBeDefined()
    expect(cellByText('Milk'), 'Milk should restore').toBeDefined()
  })

  it('Backspace on multi-cell selection clears N cells in a single undo entry', async () => {
    await act(async () => dom.root.render(createElement(App)))

    // Select A2:A4 (Apple, Bread, Milk) by clicking A2, shift-clicking A4 — but drag select is
    // simpler: just shift-click to extend.
    const apple = cellByText('Apple')!
    const milk = cellByText('Milk')!
    act(() => click(apple))
    // Shift-click via mousedown with shiftKey
    act(() => click(milk, { shiftKey: true }))

    act(() => press('Backspace'))
    expect(cellByText('Apple')).toBeUndefined()
    expect(cellByText('Milk')).toBeUndefined()

    // Single undo should restore ALL three cells (batch via writeCells / ops.patch).
    act(() => press('z', { ctrlKey: true }))
    expect(cellByText('Apple'), 'Apple should restore from single undo').toBeDefined()
    expect(cellByText('Milk'), 'Milk should restore from single undo').toBeDefined()
  })

  it('replace all across multiple cells is a single undo entry', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => press('h', { ctrlKey: true }))
    const inputs = document.querySelectorAll<HTMLInputElement>('.find-bar input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    act(() => setInputValue(inputs[0], 'e'))
    act(() => setInputValue(inputs[1], 'X'))

    const replaceAll = [...document.querySelectorAll<HTMLButtonElement>('.find-bar button')]
      .find((button) => button.textContent === '전체')
    expect(replaceAll).toBeDefined()
    act(() => click(replaceAll!))

    expect(cellByText('ApplX')).toBeDefined()
    expect(cellByText('BrXad')).toBeDefined()

    act(() => press('z', { ctrlKey: true }))

    expect(cellByText('Apple')).toBeDefined()
    expect(cellByText('Bread')).toBeDefined()
    expect(cellByText('ApplX')).toBeUndefined()
    expect(cellByText('BrXad')).toBeUndefined()
  })
})
