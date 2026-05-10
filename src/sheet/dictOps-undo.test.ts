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
})
