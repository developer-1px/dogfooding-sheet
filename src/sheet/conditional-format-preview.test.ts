import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { mouseClick } from './test-utils'

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

describe('conditional formatting preview interactions', () => {
  it('does not crash when the conditional formatting button is clicked with the mouse', async () => {
    await act(async () => root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((item) => item.textContent === '🎨조건')

    expect(button).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(button!))
    }).not.toThrow()
  })
})
