import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cellByText, cells as gridCells, mouseClick as click, press, setupReactDom } from './test-utils'

const dom = setupReactDom()

describe('multi-sheet partition (preview)', () => {
  it('bold on Sheet1 A2 does not leak into Sheet2; survives switch back', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const apple = cellByText('Apple')
    expect(apple, 'Sheet1 should show Apple in A2').toBeDefined()
    act(() => click(apple!))
    act(() => press('b', { ctrlKey: true }))
    expect(apple!.className).toContain('bold')

    const addBtn = document.querySelector<HTMLButtonElement>('.tab-add')
    expect(addBtn).not.toBeNull()
    act(() => click(addBtn!))

    const fresh = gridCells().find((c) => c.textContent?.trim() === '')
    expect(fresh, 'Sheet2 cells should be empty').toBeDefined()
    expect(fresh!.className).not.toContain('bold')

    const sheet1Tab = [...document.querySelectorAll<HTMLElement>('.tab')].find((t) => t.textContent?.includes('Sheet1'))
    expect(sheet1Tab).toBeDefined()
    act(() => click(sheet1Tab!))

    const restored = cellByText('Apple')
    expect(restored, 'Sheet1 cells should be restored').toBeDefined()
    expect(restored!.className).toContain('bold')
  })
})
