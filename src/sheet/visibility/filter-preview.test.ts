import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { cells, mouseClick, setInputValue, setupReactDOM } from '../test-utils'

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

  it('marks the filtered column header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(cells()[1]))
    const filter = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.startsWith('🔽필터'))
    expect(filter).not.toBeUndefined()

    await act(async () => mouseClick(filter!))
    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')
    expect(input).not.toBeNull()
    await act(async () => setInputValue(input!, '>1'))
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.prompt-dialog button')]
      .find((button) => button.textContent === '필터')!.click())

    expect(document.querySelector('[aria-label="B열 필터 적용"]')).not.toBeNull()
  })
})
