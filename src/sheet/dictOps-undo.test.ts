import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

let root: Root
let host: HTMLDivElement

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  localStorage.clear()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  localStorage.clear()
})

const click = (el: Element) => {
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
}
const press = (key: string, mod: { ctrlKey?: boolean } = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))
const cellByText = (text: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find((c) => c.textContent?.trim() === text)

describe('surgical key-path undo (zod-crud audit fix)', () => {
  it('bolding two cells then one undo only un-bolds the second', async () => {
    await act(async () => root.render(createElement(App)))

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
    await act(async () => root.render(createElement(App)))
    // initialSheet has D2 = '=B2*C2' where B2=3, C2=1.50 → 4.5 (formatted '4.5')
    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const d2 = cells.find((c) => c.textContent?.trim() === '4.5')
    expect(d2, '=B2*C2 should compute to 4.5 (3 × 1.50)').toBeDefined()
  })

  it('Cmd+X (cut) on multi-cell selection is a single undo entry', async () => {
    await act(async () => root.render(createElement(App)))
    const apple = cellByText('Apple')!; const milk = cellByText('Milk')!
    act(() => click(apple))
    act(() => {
      milk.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, shiftKey: true }))
      milk.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, shiftKey: true }))
    })
    act(() => press('x', { ctrlKey: true }))
    expect(cellByText('Apple')).toBeUndefined()
    expect(cellByText('Milk')).toBeUndefined()
    act(() => press('z', { ctrlKey: true }))
    expect(cellByText('Apple')).toBeDefined()
    expect(cellByText('Milk')).toBeDefined()
  })

  it('Cmd+D fillDown across N cells is a single undo entry', async () => {
    await act(async () => root.render(createElement(App)))
    const apple = cellByText('Apple')!; const milk = cellByText('Milk')!
    act(() => click(apple))
    act(() => {
      milk.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, shiftKey: true }))
      milk.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, shiftKey: true }))
    })
    act(() => press('d', { ctrlKey: true }))
    expect([...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].filter((c) => c.textContent === 'Apple').length).toBe(3)
    act(() => press('z', { ctrlKey: true }))
    // Bread/Milk should be restored, Apple count back to 1
    expect(cellByText('Bread'), 'Bread should restore').toBeDefined()
    expect(cellByText('Milk'), 'Milk should restore').toBeDefined()
  })

  it('Backspace on multi-cell selection clears N cells in a single undo entry', async () => {
    await act(async () => root.render(createElement(App)))

    // Select A2:A4 (Apple, Bread, Milk) by clicking A2, shift-clicking A4 — but drag select is
    // simpler: just shift-click to extend.
    const apple = cellByText('Apple')!
    const milk = cellByText('Milk')!
    act(() => click(apple))
    // Shift-click via mousedown with shiftKey
    act(() => {
      milk.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, shiftKey: true }))
      milk.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, shiftKey: true }))
    })

    act(() => press('Backspace'))
    expect(cellByText('Apple')).toBeUndefined()
    expect(cellByText('Milk')).toBeUndefined()

    // Single undo should restore ALL three cells (batch via writeCells / ops.patch).
    act(() => press('z', { ctrlKey: true }))
    expect(cellByText('Apple'), 'Apple should restore from single undo').toBeDefined()
    expect(cellByText('Milk'), 'Milk should restore from single undo').toBeDefined()
  })
})
