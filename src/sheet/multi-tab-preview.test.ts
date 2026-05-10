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

const press = (key: string, mod: { metaKey?: boolean } = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))

const cellByText = (text: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')].find((c) => c.textContent?.trim() === text)

describe('multi-sheet partition (preview)', () => {
  it('bold on Sheet1 A2 does not leak into Sheet2; survives switch back', async () => {
    await act(async () => root.render(createElement(App)))

    const apple = cellByText('Apple')
    expect(apple, 'Sheet1 should show Apple in A2').toBeDefined()
    act(() => click(apple!))
    act(() => press('b', { metaKey: true }))
    expect(apple!.className).toContain('bold')

    const addBtn = document.querySelector<HTMLButtonElement>('.tab-add')
    expect(addBtn).not.toBeNull()
    act(() => click(addBtn!))

    const allCells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const fresh = allCells.find((c) => c.textContent?.trim() === '')
    expect(fresh, 'Sheet2 cells should be empty').toBeDefined()
    expect(fresh!.className).not.toContain('bold')

    const sheet1Tab = [...document.querySelectorAll<HTMLElement>('.tab')].find((t) => t.textContent?.includes('Sheet1'))
    expect(sheet1Tab).toBeDefined()
    act(() => click(sheet1Tab!))

    const restored = cellByText('Apple')
    expect(restored, 'Sheet1 cells should be restored').toBeDefined()
    expect(restored!.className).toContain('bold')
  })
})
