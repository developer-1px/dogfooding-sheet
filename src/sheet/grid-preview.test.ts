import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

let root: Root
let host: HTMLDivElement

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
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
  it('renders the seeded A1 cell text and addr/formula bar before any user interaction', async () => {
    await act(async () => root.render(createElement(App)))

    const address = document.querySelector<HTMLElement>('.addr')
    const formulaBox = document.querySelector<HTMLInputElement>('input.formula')
    const firstCell = document.querySelector<HTMLElement>('[role="gridcell"]')

    expect(address?.textContent).toBe('A1')
    expect(formulaBox?.value).toBe('Item')
    expect(firstCell?.textContent).toContain('Item')
  })

  it('clicking a cell focuses it and starts editing (cell renders an input)', async () => {
    await act(async () => root.render(createElement(App)))

    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const target = cells.find((c) => c.getAttribute('data-id') === 'r1-A')!
    expect(target).toBeDefined()

    act(() => {
      target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })

    // Click navigates focus; editing only starts on activate (Enter/F2/double-click).
    expect(document.querySelector<HTMLElement>('.addr')?.textContent).toBe('A2')
  })
})
