import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, press, setInputValue, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const contextMenu = (target: Element) => {
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: 30, clientY: 30 }))
}

const header = (selector: string, text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>(selector)]
    .find((el) => el.textContent?.trim().startsWith(text))

const rowHeader = (text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>('.row-header')]
    .find((el) => el.childNodes[0]?.textContent?.trim() === text)

const addressText = (): string | undefined =>
  document.querySelector<HTMLButtonElement>('.addr')?.textContent?.trim()

const formulaValue = (): string | undefined =>
  document.querySelector<HTMLInputElement>('.formula')?.value

describe('header context menus', () => {
  it('shows column-specific actions from a column header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')
    expect(col).toBeTruthy()

    act(() => contextMenu(col!))

    expect(document.querySelector('.ctx-menu')?.getAttribute('aria-label')).toBe('열 헤더 컨텍스트 메뉴')
    expect(document.body.textContent).toContain('B열 왼쪽에 삽입')
    expect(document.body.textContent).toContain('B 오름차순 정렬')
    expect(document.body.textContent).not.toContain('잘라내기')
  })

  it('shows row-specific actions from a row header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const row = rowHeader('2')
    expect(row).toBeTruthy()

    act(() => contextMenu(row!))

    expect(document.querySelector('.ctx-menu')?.getAttribute('aria-label')).toBe('행 헤더 컨텍스트 메뉴')
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

  it('can restore a hidden adjacent row from a header menu', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => contextMenu(rowHeader('2')!))
    act(() => document.querySelectorAll<HTMLButtonElement>('.ctx-item')
      .forEach((button) => { if (button.textContent === '2행 숨기기') button.click() }))
    expect(rowHeader('2')).toBeUndefined()

    act(() => contextMenu(rowHeader('1')!))
    const restore = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]
      .find((button) => button.textContent === '2행 숨김 표시')
    expect(restore).toBeTruthy()

    act(() => restore!.click())
    expect(rowHeader('2')).toBeTruthy()
  })

  it('shows an inline unhide control beside hidden rows', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => contextMenu(rowHeader('2')!))
    act(() => document.querySelectorAll<HTMLButtonElement>('.ctx-item')
      .forEach((button) => { if (button.textContent === '2행 숨기기') button.click() }))
    expect(rowHeader('2')).toBeUndefined()

    const restore = document.querySelector<HTMLButtonElement>('.unhide-row[aria-label="2행 숨김 표시"]')
    expect(restore).toBeTruthy()

    act(() => restore!.click())
    expect(rowHeader('2')).toBeTruthy()
  })

  it('marks selected row and column headers', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')
    const row = rowHeader('2')
    expect(col).toBeTruthy()
    expect(row).toBeTruthy()
    expect(col!.getAttribute('aria-label')).toBe('B열')
    expect(row!.getAttribute('aria-label')).toBe('2행')

    act(() => mouseClick(col!))
    expect(col!.classList.contains('selected-header')).toBe(true)
    expect(col!.getAttribute('aria-selected')).toBe('true')

    act(() => mouseClick(row!))
    expect(row!.classList.contains('selected-header')).toBe(true)
    expect(row!.getAttribute('aria-selected')).toBe('true')
  })

  it('keeps selected and current states together on header selections', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')!
    act(() => mouseClick(col))
    expect(col.getAttribute('aria-selected')).toBe('true')
    expect(col.getAttribute('aria-current')).toBe('true')

    const row = rowHeader('2')!
    act(() => mouseClick(row))
    expect(row.getAttribute('aria-selected')).toBe('true')
    expect(row.getAttribute('aria-current')).toBe('true')
  })

  it('marks current row and column headers for the focused cell', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[11]))

    expect(header('.header-cell', 'B')?.getAttribute('aria-current')).toBe('true')
    expect(rowHeader('2')?.getAttribute('aria-current')).toBe('true')
    expect(header('.header-cell', 'A')?.getAttribute('aria-current')).toBeNull()
    expect(rowHeader('1')?.getAttribute('aria-current')).toBeNull()
  })

  it('moves header aria-current with keyboard focus navigation', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    expect(header('.header-cell', 'A')?.getAttribute('aria-current')).toBe('true')
    expect(rowHeader('1')?.getAttribute('aria-current')).toBe('true')

    act(() => keyDown(cells[0], 'ArrowRight'))
    await act(async () => {})

    expect(header('.header-cell', 'A')?.getAttribute('aria-current')).toBeNull()
    expect(header('.header-cell', 'B')?.getAttribute('aria-current')).toBe('true')
    expect(rowHeader('1')?.getAttribute('aria-current')).toBe('true')

    const focused = document.querySelector<HTMLElement>('.cell.focused')!
    act(() => keyDown(focused, 'ArrowDown'))
    await act(async () => {})

    expect(rowHeader('1')?.getAttribute('aria-current')).toBeNull()
    expect(rowHeader('2')?.getAttribute('aria-current')).toBe('true')
  })

  it('marks headers touched by a selected range', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight', { shiftKey: true }))
    await act(async () => {})

    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(rowHeader('1')?.classList.contains('selected-header')).toBe(true)
  })

  it('extends column header selection from the previous header click', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(header('.header-cell', 'B')!))
    act(() => mouseClick(header('.header-cell', 'D')!, { shiftKey: true }))

    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(false)
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'C')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'D')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('B:D')
  })

  it('extends row header selection from the previous header click', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(rowHeader('2')!))
    act(() => mouseClick(rowHeader('4')!, { shiftKey: true }))

    expect(rowHeader('1')?.classList.contains('selected-header')).toBe(false)
    expect(rowHeader('2')?.classList.contains('selected-header')).toBe(true)
    expect(rowHeader('3')?.classList.contains('selected-header')).toBe(true)
    expect(rowHeader('4')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('2:4')
  })

  it('marks the corner header when the whole sheet is selected', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const corner = document.querySelector<HTMLElement>('.corner-cell')
    expect(corner).toBeTruthy()
    expect(corner!.getAttribute('aria-label')).toBe('전체 시트 선택')
    expect(corner!.title).toBe('전체 시트 선택')

    act(() => mouseClick(corner!))

    expect(corner!.classList.contains('selected-header')).toBe(true)
    expect(corner!.getAttribute('aria-selected')).toBe('true')
    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(true)
    expect(rowHeader('1')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('A:J')
  })

  it('marks headers and address when keyboard shortcuts select rows, columns, and all cells', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[11]))

    act(() => press(' ', { ctrlKey: true }))
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('B:B')

    act(() => mouseClick(cells[11]))
    act(() => press(' ', { shiftKey: true }))
    expect(rowHeader('2')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('2:2')

    act(() => press('a', { ctrlKey: true }))
    expect(document.querySelector<HTMLElement>('.corner-cell')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('A:J')
    expect(formulaValue()).toBe('Item')
  })

  it('expands selected ranges to whole rows or columns with keyboard shortcuts', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight', { shiftKey: true }))
    await act(async () => {})

    act(() => press(' ', { ctrlKey: true }))
    expect(header('.header-cell', 'A')?.classList.contains('selected-header')).toBe(true)
    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('A:B')

    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowDown', { shiftKey: true }))
    await act(async () => {})

    act(() => press(' ', { shiftKey: true }))
    expect(rowHeader('1')?.classList.contains('selected-header')).toBe(true)
    expect(rowHeader('2')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('1:2')
  })

  it('clears header selected state and aria state with Escape', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const col = header('.header-cell', 'B')!
    act(() => mouseClick(col))
    expect(col.classList.contains('selected-header')).toBe(true)
    expect(col.getAttribute('aria-selected')).toBe('true')

    act(() => press('Escape'))

    expect(col.classList.contains('selected-header')).toBe(false)
    expect(col.getAttribute('aria-selected')).toBe('false')
  })

  it('goes to whole column and row ranges from the address prompt', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(document.querySelector<HTMLButtonElement>('.addr')!))
    expect(document.body.textContent).toContain('이동할 셀 또는 범위 (예: B5, A1:C3, B:B, 2:2)')
    const prompt = document.querySelector<HTMLInputElement>('.prompt-dialog input')!
    expect(prompt.placeholder).toBe('B5 또는 B:B')
    act(() => {
      setInputValue(prompt, 'B:B')
      keyDown(prompt, 'Enter')
    })
    await act(async () => {})

    expect(header('.header-cell', 'B')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('B:B')

    act(() => mouseClick(document.querySelector<HTMLButtonElement>('.addr')!))
    const prompt2 = document.querySelector<HTMLInputElement>('.prompt-dialog input')!
    act(() => {
      setInputValue(prompt2, '2:2')
      keyDown(prompt2, 'Enter')
    })
    await act(async () => {})

    expect(rowHeader('2')?.classList.contains('selected-header')).toBe(true)
    expect(addressText()).toBe('2:2')
  })
})
