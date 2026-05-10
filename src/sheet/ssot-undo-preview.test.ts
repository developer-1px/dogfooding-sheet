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

const mouseClick = (target: Element) => {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
  target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
}

const press = (key: string, mod: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key, ...mod }))

describe('SSOT: undo restores ancillary state (styles)', () => {
  it('Cmd+B applies bold; Cmd+Z removes it (style is undoable via zod-crud)', async () => {
    await act(async () => root.render(createElement(App)))

    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a2 = cells.find((c) => c.textContent?.trim() === 'Apple')
    expect(a2, 'A2 cell should render as "Apple"').toBeDefined()

    act(() => mouseClick(a2!))
    act(() => press('b', { metaKey: true }))
    expect(a2!.className).toContain('bold')

    act(() => press('z', { metaKey: true }))
    expect(a2!.className).not.toContain('bold')
  })
})
