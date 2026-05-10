import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('debug', () => {
  it('investigate', async () => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    const host = document.createElement('div'); document.body.append(host)
    const root = createRoot(host)
    await act(async () => root.render(createElement(App)))
    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a5 = cells[40]
    console.log('a5 data-id', a5?.getAttribute('data-id'), 'tabindex', a5?.tabIndex)
    act(() => {
      a5.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    console.log('after click', document.activeElement?.tagName, (document.activeElement as HTMLElement)?.getAttribute('data-id'))
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'H' })) })
    console.log('after H, active', document.activeElement?.tagName, document.activeElement?.className)
    const input = document.querySelector('input.cell-input')
    console.log('input present?', !!input, (input as HTMLInputElement)?.value)
    expect(true).toBe(true)
  })
})
