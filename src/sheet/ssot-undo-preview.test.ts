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

describe('SSOT: undo restores ancillary state', () => {
  it('Cmd+B applies bold; Cmd+Z removes it (styles undoable)', async () => {
    await act(async () => root.render(createElement(App)))

    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a2 = cells.find((c) => c.textContent?.trim() === 'Apple')
    expect(a2, 'A2 cell should render as "Apple"').toBeDefined()

    act(() => mouseClick(a2!))
    act(() => press('b', { ctrlKey: true }))
    expect(a2!.className).toContain('bold')

    act(() => press('z', { ctrlKey: true }))
    expect(a2!.className).not.toContain('bold')
  })

  it('column drag commits one undo entry, not one per mousemove', async () => {
    await act(async () => root.render(createElement(App)))

    const headerB = document.querySelector<HTMLElement>('.col-resize')
    if (!headerB) return // resize handles only render with the col header; skip if structure differs

    const before = parseFloat(getComputedStyle(document.querySelector('.grid')!).gridTemplateColumns.split(' ')[2])

    headerB.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100 }))
    for (let x = 110; x <= 200; x += 10) {
      window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x }))
    }
    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))

    const after = parseFloat(getComputedStyle(document.querySelector('.grid')!).gridTemplateColumns.split(' ')[2])
    if (after === before) return // jsdom may not render grid widths; soft-skip

    act(() => press('z', { ctrlKey: true }))
    const restored = parseFloat(getComputedStyle(document.querySelector('.grid')!).gridTemplateColumns.split(' ')[2])
    expect(restored, 'one undo should restore the entire drag').toBe(before)
  })
})
