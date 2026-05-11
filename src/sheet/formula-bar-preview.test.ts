import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { mouseClick as click, setupReactDom } from './test-utils'

const dom = setupReactDom()

const press = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key }))
}

describe('formula bar preview interactions', () => {
  it('does not let grid typing shortcuts steal keyboard input from the formula bar', async () => {
    await act(async () => dom.root.render(createElement(App)))

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
