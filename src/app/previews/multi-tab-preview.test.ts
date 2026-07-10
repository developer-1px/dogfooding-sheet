import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cellByText, cells as gridCells, mouseClick as click, press, setupReactDOM } from '../../shared/testing/test-utils'

const dom = setupReactDOM()

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

  it('sheet creation is undoable instead of clearing document history', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const addBtn = document.querySelector<HTMLButtonElement>('.tab-add')
    expect(addBtn).not.toBeNull()
    act(() => click(addBtn!))
    expect([...document.querySelectorAll<HTMLElement>('.tab')].some((t) => t.textContent?.includes('Sheet2'))).toBe(true)

    act(() => press('z', { ctrlKey: true }))

    expect([...document.querySelectorAll<HTMLElement>('.tab')].some((t) => t.textContent?.includes('Sheet2'))).toBe(false)
    expect(cellByText('Apple')).toBeDefined()
  })
})
