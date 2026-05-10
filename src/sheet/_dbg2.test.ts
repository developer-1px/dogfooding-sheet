import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('debug2', () => {
  it('investigate', async () => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    const host = document.createElement('div'); document.body.append(host)
    const root = createRoot(host)
    const log: string[] = []
    await act(async () => root.render(createElement(App)))
    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a5 = cells[40]
    act(() => {
      a5.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    log.push('focus=' + document.querySelector('.addr')?.textContent)
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'H' })) })
    log.push('after H, addr=' + document.querySelector('.addr')?.textContent)
    log.push('inputs:')
    for (const i of [...document.querySelectorAll('input')]) {
      log.push('  cls=' + i.className + ' value=' + JSON.stringify(i.value))
    }
    expect(log.join('\n')).toBe('SEE_BELOW')
  })
})
