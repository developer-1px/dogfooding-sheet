import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, press, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const header = (selector: string, text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>(selector)]
    .find((el) => el.textContent?.trim().startsWith(text))

const rowHeader = (text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>('.row-header')]
    .find((el) => el.childNodes[0]?.textContent?.trim() === text)

const contextMenu = (target: Element) => {
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: 30, clientY: 30 }))
}

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

  it('resets range anchor after selecting a column header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))
    act(() => mouseClick(header('.header-cell', 'C')!))
    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Price')

    act(() => keyDown(focused!, 'ArrowRight', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Price', 'Total'])
  })

  it('resets range anchor after selecting a row header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))
    act(() => mouseClick(rowHeader('3')!))
    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Bread')

    act(() => keyDown(focused!, 'ArrowDown', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Bread', 'Milk'])
  })

  it('resets range anchor after opening a column header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))
    act(() => contextMenu(header('.header-cell', 'C')!))
    act(() => press('Escape'))

    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Price')

    act(() => keyDown(focused!, 'ArrowRight', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Price', 'Total'])
  })

  it('resets range anchor after opening a row header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))
    act(() => contextMenu(rowHeader('3')!))
    act(() => press('Escape'))

    const focused = document.querySelector<HTMLElement>('.cell.focused')
    expect(focused?.textContent).toContain('Bread')

    act(() => keyDown(focused!, 'ArrowDown', { shiftKey: true }))

    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected.map((cell) => cell.textContent?.trim())).toEqual(['Bread', 'Milk'])
  })
})
