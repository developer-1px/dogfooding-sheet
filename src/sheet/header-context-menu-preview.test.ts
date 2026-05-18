import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const contextMenu = (target: Element) => {
  target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, button: 2, clientX: 30, clientY: 30 }))
}

describe('header context menus', () => {
  it('shows column-specific actions from a column header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const header = [...document.querySelectorAll<HTMLElement>('.header-cell')]
      .find((el) => el.textContent?.trim().startsWith('B'))
    expect(header).toBeTruthy()

    act(() => contextMenu(header!))

    expect(document.body.textContent).toContain('B열 왼쪽에 삽입')
    expect(document.body.textContent).toContain('B 오름차순 정렬')
    expect(document.body.textContent).not.toContain('잘라내기')
  })

  it('shows row-specific actions from a row header', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const header = [...document.querySelectorAll<HTMLElement>('.row-header')]
      .find((el) => el.textContent?.trim().startsWith('2'))
    expect(header).toBeTruthy()

    act(() => contextMenu(header!))

    expect(document.body.textContent).toContain('위에 행 삽입')
    expect(document.body.textContent).toContain('2행 높이')
    expect(document.body.textContent).not.toContain('하이퍼링크 삽입')
  })
})
