import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, press, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

describe('keyboard selection anchor', () => {
  it('resets range anchor after plain keyboard navigation', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight'))
    await act(async () => {})

    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Qty')

    act(() => keyDown(focused!, 'ArrowDown', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected).toHaveLength(2)
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Qty', '3'])
  })

  it('resets range anchor after selecting all cells with the keyboard', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[11]))
    act(() => press('a', { ctrlKey: true }))
    await act(async () => {})

    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Item')

    act(() => keyDown(focused!, 'ArrowRight', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Item', 'Qty'])
  })
})
