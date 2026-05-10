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

describe('validation preview interactions', () => {
  it('does not crash when the list validation button is clicked with the mouse', async () => {
    await act(async () => root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const list = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '▾목록')

    expect(list).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(list!))
    }).not.toThrow()
  })
})
