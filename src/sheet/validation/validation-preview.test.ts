import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { mouseClick, setupReactDOM } from '../test-utils'

const dom = setupReactDOM()

describe('validation preview interactions', () => {
  it('does not crash when the list validation button is clicked with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const list = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '▾목록')

    expect(list).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(list!))
    }).not.toThrow()
  })
})
