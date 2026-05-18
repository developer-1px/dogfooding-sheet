import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { mouseClick, setupReactDOM } from '../test-utils'

const dom = setupReactDOM()

describe('filter preview interactions', () => {
  it('does not crash when the filter button is clicked with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const filter = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.startsWith('🔽필터'))

    expect(filter).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(filter!))
    }).not.toThrow()
  })
})
