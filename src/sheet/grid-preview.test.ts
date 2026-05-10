import { act } from 'react'
import { createElement } from 'react'
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

describe('spreadsheet preview interactions', () => {
  it('shows the focused cell value in the grid after selecting it with the mouse', async () => {
    await act(async () => root.render(createElement(App)))

    const address = document.querySelector<HTMLElement>('.addr')
    const formulaBox = document.querySelector<HTMLInputElement>('input[placeholder="값 또는 =A1+B1"]')
    const firstCell = document.querySelector<HTMLElement>('[role="gridcell"]')

    expect(address?.textContent).toBe('A1')
    expect(formulaBox?.value).toBe('Item')
    expect(firstCell).not.toBeNull()

    act(() => {
      firstCell?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      firstCell?.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      firstCell?.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })

    expect(firstCell?.textContent).toContain('Item')
  })
})
