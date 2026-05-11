import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, mouseClick, setInputValue, setupReactDom } from './test-utils'

const dom = setupReactDom()

const typeKey = (key: string) => {
  const inp = document.querySelector<HTMLInputElement>('input.cell-input')
  if (inp) {
    inp.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
    if (key === 'Enter' || key === 'Escape' || key === 'Tab') return
    if (key.length === 1) setInputValue(inp, inp.value + key)
    return
  }
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
}

describe('spreadsheet preview interactions', () => {
  it('commits text typed directly after selecting an empty cell with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const a5 = gridCells()[40]

    expect(a5).not.toBeUndefined()

    act(() => mouseClick(a5))
    for (const key of 'Hello') act(() => typeKey(key))
    act(() => typeKey('Enter'))

    expect(a5.textContent).toContain('Hello')
  })
})
