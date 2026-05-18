import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, mouseClick, press, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

describe('status bar preview', () => {
  it('counts the focused cell as one selected cell', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))

    expect(document.querySelector('.status-bar')?.textContent).toContain('1 셀')
  })

  it('summarizes whole row, column, and sheet selections', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[11]))

    act(() => press(' ', { ctrlKey: true }))
    expect(document.querySelector('.status-bar')?.textContent).toContain('1열 선택')

    act(() => mouseClick(gridCells()[11]))
    act(() => press(' ', { shiftKey: true }))
    expect(document.querySelector('.status-bar')?.textContent).toContain('1행 선택')

    act(() => press('a', { ctrlKey: true }))
    expect(document.querySelector('.status-bar')?.textContent).toContain('전체 시트')
  })
})
