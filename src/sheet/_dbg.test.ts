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
    const log: string[] = []
    const note = (s: string) => log.push(s)
    await act(async () => root.render(createElement(App)))

    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a5 = cells[40]
    act(() => {
      a5.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    note('focusId via aria? ' + a5?.getAttribute('aria-selected'))
    note('addr text ' + document.querySelector('.addr')?.textContent)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'H' })) })
    note('addr text after H ' + document.querySelector('.addr')?.textContent)
    const inputs = [...document.querySelectorAll('input')]
    note('inputs ' + inputs.map(i => i.className + '=' + JSON.stringify(i.value)).join('; '))
    expect(log.join('\n')).toBe('SEE_BELOW')
  })
})
