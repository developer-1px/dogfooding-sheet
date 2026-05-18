import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cells as gridCells, keyDown, mouseClick, setInputValue, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const startFormulaEdit = async () => {
  await act(async () => dom.root.render(createElement(App)))

  const a1 = gridCells()[0]
  act(() => mouseClick(a1))
  act(() => keyDown(a1, 'F2'))

  const input = document.querySelector<HTMLInputElement>('input.cell-input')!
  act(() => setInputValue(input, '='))
  return input
}

describe('formula reference picking', () => {
  it('inserts a cell reference with arrow keys while editing a formula', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))

    expect(input.value).toBe('=B1')
    expect(document.querySelector<HTMLElement>('.cell.selected')?.textContent).toContain('Qty')
  })

  it('extends the inserted reference to a range with Shift+Arrow', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))
    act(() => keyDown(input, 'ArrowDown', { shiftKey: true }))

    expect(input.value).toBe('=B1:B2')
    expect([...document.querySelectorAll<HTMLElement>('.cell.selected')]).toHaveLength(2)
  })

  it('inserts a clicked cell reference without leaving formula edit', async () => {
    const input = await startFormulaEdit()
    const b2 = gridCells()[11]

    act(() => mouseClick(b2))

    expect(document.querySelector<HTMLInputElement>('input.cell-input')).toBe(input)
    expect(input.value).toBe('=B2')
  })
})
