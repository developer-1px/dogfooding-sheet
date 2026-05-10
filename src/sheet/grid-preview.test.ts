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

const typeKey = (key: string) => {
  const inp = document.querySelector<HTMLInputElement>('input.cell-input')
  if (inp) {
    inp.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
    if (key === 'Enter' || key === 'Escape' || key === 'Tab') return
    if (key.length === 1) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(inp, inp.value + key)
      inp.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return
  }
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
}

describe('spreadsheet preview interactions', () => {
  it('commits text typed directly after selecting an empty cell with the mouse', async () => {
    await act(async () => root.render(createElement(App)))

    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a5 = cells[40]

    expect(a5).not.toBeUndefined()

    act(() => mouseClick(a5))
    for (const key of 'Hello') act(() => typeKey(key))
    act(() => typeKey('Enter'))

    expect(a5.textContent).toContain('Hello')
  })
})
