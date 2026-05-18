import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { mouseClick, setupReactDOM } from '../test-utils'

const dom = setupReactDOM()

describe('conditional formatting preview interactions', () => {
  it('does not crash when the conditional formatting button is clicked with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((item) => item.textContent === '🎨조건')

    expect(button).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(button!))
    }).not.toThrow()
  })
})
