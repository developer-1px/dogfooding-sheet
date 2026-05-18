import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { setupReactDOM } from './test-utils'

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
})
