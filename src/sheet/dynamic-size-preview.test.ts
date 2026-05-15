import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { setupReactDom } from './test-utils'

const dom = setupReactDom()

const buttonByText = (text: string): HTMLButtonElement => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
    .find((el) => el.textContent?.trim() === text)
  if (!button) throw new Error(`button not found: ${text}`)
  return button
}

describe('dynamic sheet size', () => {
  it('appends rows and columns from the toolbar', async () => {
    await act(async () => dom.root.render(createElement(App)))

    expect(document.querySelectorAll('.row-header')).toHaveLength(20)
    expect([...document.querySelectorAll('.header-cell')].map((el) => el.textContent?.trim()[0])).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    ])

    await act(async () => buttonByText('+20행').click())
    expect(document.querySelectorAll('.row-header')).toHaveLength(40)

    await act(async () => buttonByText('+끝열').click())
    expect([...document.querySelectorAll('.header-cell')].map((el) => el.textContent?.trim()[0])).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
    ])
  })
})

