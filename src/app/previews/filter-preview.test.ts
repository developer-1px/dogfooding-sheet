import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells, mouseClick, setInputValue, setupReactDOM } from '../../shared/testing/test-utils'

const dom = setupReactDOM()

const applyFilterToB = async () => {
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
}

const contextMenu = (target: Element) => {
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: 30, clientY: 30 }))
}

const filteredColumnHeader = (column: string) =>
  [...document.querySelectorAll<HTMLElement>('.header-cell.filtered')]
    .find((header) => header.textContent?.trim().startsWith(column))

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

    await applyFilterToB()

    const header = filteredColumnHeader('B')
    expect(header).toBeDefined()
    expect(header?.getAttribute('aria-label')).toContain('B열')
    expect(header?.getAttribute('aria-label')).toContain('필터 적용')
  })

  it('clears a filter from the filtered column header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))
    await applyFilterToB()

    const header = [...document.querySelectorAll<HTMLElement>('.header-cell')]
      .find((el) => el.textContent?.trim().startsWith('B'))
    expect(header).toBeTruthy()

    act(() => contextMenu(header!))
    const clear = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]
      .find((button) => button.textContent === '필터 해제')
    expect(clear).toBeTruthy()

    act(() => clear!.click())
    expect(filteredColumnHeader('B')).toBeUndefined()
  })

  it('applies a filter from the column header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const header = [...document.querySelectorAll<HTMLElement>('.header-cell')]
      .find((el) => el.textContent?.trim().startsWith('B'))
    expect(header).toBeTruthy()

    act(() => contextMenu(header!))
    const apply = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]
      .find((button) => button.textContent === '필터 적용…')
    expect(apply).toBeTruthy()

    await act(async () => apply!.click())
    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')
    expect(input).not.toBeNull()
    await act(async () => setInputValue(input!, '>1'))
    await act(async () => [...document.querySelectorAll<HTMLButtonElement>('.prompt-dialog button')]
      .find((button) => button.textContent === '필터')!.click())

    const filteredHeader = filteredColumnHeader('B')
    expect(filteredHeader).toBeDefined()
    expect(filteredHeader?.getAttribute('aria-label')).toContain('필터 적용')
  })
})
