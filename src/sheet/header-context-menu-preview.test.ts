import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const contextMenu = (target: Element) => {
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: 30, clientY: 30 }))
}

const header = (selector: string, text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>(selector)]
    .find((el) => el.textContent?.trim().startsWith(text))

describe('header context menus', () => {
  it('shows column-specific actions from a column header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')
    expect(col).toBeTruthy()

    act(() => contextMenu(col!))

    expect(document.body.textContent).toContain('B열 왼쪽에 삽입')
    expect(document.body.textContent).toContain('B 오름차순 정렬')
    expect(document.body.textContent).not.toContain('잘라내기')
  })

  it('shows row-specific actions from a row header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const row = header('.row-header', '2')
    expect(row).toBeTruthy()

    act(() => contextMenu(row!))

    expect(document.body.textContent).toContain('위에 행 삽입')
    expect(document.body.textContent).toContain('2행 높이')
    expect(document.body.textContent).not.toContain('하이퍼링크 삽입')
  })

  it('can restore a hidden adjacent column from a header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => contextMenu(header('.header-cell', 'B')!))
    act(() => document.querySelectorAll<HTMLButtonElement>('.ctx-item')
      .forEach((button) => { if (button.textContent === 'B열 숨기기') button.click() }))
    expect(header('.header-cell', 'B')).toBeUndefined()

    act(() => contextMenu(header('.header-cell', 'A')!))
    const restore = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]
      .find((button) => button.textContent === 'B열 숨김 표시')
    expect(restore).toBeTruthy()

    act(() => restore!.click())
    expect(header('.header-cell', 'B')).toBeTruthy()
  })

  it('shows an inline unhide control beside hidden columns', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => contextMenu(header('.header-cell', 'B')!))
    act(() => document.querySelectorAll<HTMLButtonElement>('.ctx-item')
      .forEach((button) => { if (button.textContent === 'B열 숨기기') button.click() }))
    expect(header('.header-cell', 'B')).toBeUndefined()

    const restore = document.querySelector<HTMLButtonElement>('.unhide-col[aria-label="B열 숨김 표시"]')
    expect(restore).toBeTruthy()

    act(() => restore!.click())
    expect(header('.header-cell', 'B')).toBeTruthy()
  })

  it('marks selected row and column headers', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')
    const row = header('.row-header', '2')
    expect(col).toBeTruthy()
    expect(row).toBeTruthy()

    act(() => mouseClick(col!))
    expect(col!.classList.contains('selected-header')).toBe(true)

    act(() => mouseClick(row!))
    expect(row!.classList.contains('selected-header')).toBe(true)
  })

  it('marks headers touched by a selected range', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight', { shiftKey: true }))
    await act(async () => {})

    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(header('.row-header', '1')?.classList.contains('selected-header')).toBe(true)
  })

  it('extends column header selection from the previous header click', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(header('.header-cell', 'B')!))
    act(() => mouseClick(header('.header-cell', 'D')!, { shiftKey: true }))

    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(false)
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'C')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'D')?.classList.contains('selected-header')).toBe(true)
  })

  it('extends row header selection from the previous header click', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(header('.row-header', '2')!))
    act(() => mouseClick(header('.row-header', '4')!, { shiftKey: true }))

    expect(header('.row-header', '1')?.classList.contains('selected-header')).toBe(false)
    expect(header('.row-header', '2')?.classList.contains('selected-header')).toBe(true)
    expect(header('.row-header', '3')?.classList.contains('selected-header')).toBe(true)
    expect(header('.row-header', '4')?.classList.contains('selected-header')).toBe(true)
  })

  it('marks the corner header when the whole sheet is selected', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const corner = document.querySelector<HTMLElement>('.corner-cell')
    expect(corner).toBeTruthy()

    act(() => mouseClick(corner!))

    expect(corner!.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(true)
    expect(header('.row-header', '1')?.classList.contains('selected-header')).toBe(true)
  })
})
