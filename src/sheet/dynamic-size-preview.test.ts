import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, mouseClick, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const buttonByText = (text: string): HTMLButtonElement => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')]
    .find((el) => el.textContent?.trim() === text)
  if (!button) throw new Error(`button not found: ${text}`)
  return button
}

describe('dynamic sheet size', () => {
  it('labels row and column toolbar actions with the focused target', async () => {
    await act(async () => dom.root.render(createElement(App)))

    expect(buttonByText('+행').getAttribute('aria-label')).toBe('1행 위에 행 삽입')
    expect(buttonByText('−행').getAttribute('aria-label')).toBe('1행 삭제')
    expect(buttonByText('+열').getAttribute('aria-label')).toBe('A열 왼쪽에 열 삽입')
    expect(buttonByText('−열').getAttribute('aria-label')).toBe('A열 삭제')

    act(() => mouseClick(gridCells()[11]))

    expect(buttonByText('+행').getAttribute('aria-label')).toBe('2행 위에 행 삽입')
    expect(buttonByText('−행').getAttribute('aria-label')).toBe('2행 삭제')
    expect(buttonByText('+열').getAttribute('aria-label')).toBe('B열 왼쪽에 열 삽입')
    expect(buttonByText('−열').getAttribute('aria-label')).toBe('B열 삭제')
  })

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
