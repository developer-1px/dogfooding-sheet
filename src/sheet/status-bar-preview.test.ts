import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, mouseClick, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

describe('status bar preview', () => {
  it('counts the focused cell as one selected cell', async () => {
    await act(async () => dom.root.render(createElement(App)))

    act(() => mouseClick(gridCells()[0]))

    expect(document.querySelector('.status-bar')?.textContent).toContain('1 셀')
  })
})
