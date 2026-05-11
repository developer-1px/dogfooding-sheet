import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { mouseClick as click } from './test-utils'

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

const press = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
}

describe('formula bar preview interactions', () => {
  it('does not let grid typing shortcuts steal keyboard input from the formula bar', async () => {
    await act(async () => root.render(createElement(App)))

    const formula = document.querySelector<HTMLInputElement>('input[placeholder="값 또는 =A1+B1"]')
    const firstCell = document.querySelector<HTMLElement>('[role="gridcell"]')

    expect(formula?.value).toBe('Item')
    expect(firstCell?.textContent).toContain('Item')

    act(() => {
      if (!formula) return
      click(formula)
      press('C')
      press('Enter')
    })

    expect(firstCell?.textContent).toContain('Item')
  })
})
