import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, press, setupReactDOM } from '../../shared/testing/test-utils'

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

  it('summarizes multi-row and multi-column full selections', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const cells = gridCells()
    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowRight', { shiftKey: true }))
    await act(async () => {})

    act(() => press(' ', { ctrlKey: true }))
    expect(document.querySelector('.status-bar')?.textContent).toContain('2열 선택')

    act(() => mouseClick(cells[0]))
    act(() => keyDown(cells[0], 'ArrowDown', { shiftKey: true }))
    await act(async () => {})

    act(() => press(' ', { shiftKey: true }))
    expect(document.querySelector('.status-bar')?.textContent).toContain('2행 선택')
  })

  it('keeps numeric aggregates for whole-column selections', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[11]))
    act(() => press(' ', { ctrlKey: true }))

    const status = document.querySelector('.status-bar')?.textContent
    expect(status).toContain('SUM: 6')
    expect(status).toContain('COUNT: 3')
  })
})
