import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('debug', () => {
  it('useShortcuts trace', async () => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    ;(globalThis as any).__startEditCalls = []
    ;(globalThis as any).__shortcutsFired = []
    localStorage.clear()
    const host = document.createElement('div'); document.body.append(host)
    const root = createRoot(host)
    await act(async () => root.render(createElement(App)))
    const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')]
    const a5 = cells[40]
    act(() => {
      a5.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      a5.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'H' })) })
    expect(JSON.stringify({ shortcuts: (globalThis as any).__shortcutsFired, startEdit: (globalThis as any).__startEditCalls })).toBe('SEE')
  })
})
