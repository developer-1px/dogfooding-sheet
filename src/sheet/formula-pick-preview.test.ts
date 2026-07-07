import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cycleTrailingFormulaRef } from './selection/formulaPick'
import { cellEditor, cells as gridCells, keyDown, mouseClick, setContenteditableText, setupReactDOM } from './test-utils'

const dom = setupReactDOM()

const startFormulaEdit = async () => {
  await act(async () => dom.root.render(createElement(App)))

  const a1 = gridCells()[0]
  act(() => mouseClick(a1))
  act(() => keyDown(a1, 'F2'))

  const input = cellEditor()!
  act(() => setContenteditableText(input, '='))
  expect(input.classList.contains('formula-input')).toBe(true)
  expect(input.dataset.formulaEditor).toBe('true')
  return input
}

describe('formula reference picking', () => {
  it('cycles trailing references through absolute and mixed forms', () => {
    expect(cycleTrailingFormulaRef('=A1')).toBe('=$A$1')
    expect(cycleTrailingFormulaRef('=$A$1')).toBe('=A$1')
    expect(cycleTrailingFormulaRef('=A$1')).toBe('=$A1')
    expect(cycleTrailingFormulaRef('=$A1')).toBe('=A1')
    expect(cycleTrailingFormulaRef('=SUM(A1:B2')).toBe('=SUM($A$1:$B$2')
  })

  it('inserts a cell reference with arrow keys while editing a formula', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))

    expect(input.textContent).toBe('=B1')
    const picked = document.querySelector<HTMLElement>('.cell.selected')
    expect(picked?.textContent).toContain('Qty')
    expect(picked?.classList.contains('formula-ref')).toBe(true)
    expect(picked?.classList.contains('formula-ref-0')).toBe(true)
    expect(picked?.dataset.formulaRef).toBe('B1')
    const token = input.querySelector<HTMLElement>('[data-formula-token="B1"]')
    expect(token?.textContent).toBe('B1')
    expect(token?.classList.contains('formula-ref-0')).toBe(true)
  })

  it('continues moving the picked formula reference with repeated arrow keys', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))
    act(() => keyDown(input, 'ArrowRight'))

    expect(input.textContent).toBe('=C1')
    const picked = document.querySelector<HTMLElement>('.cell.formula-ref-0')
    expect(picked?.dataset.formulaRef).toBe('C1')
    expect(input.querySelector<HTMLElement>('[data-formula-token="C1"]')?.classList.contains('formula-ref-0')).toBe(true)
  })

  it('colors multiple formula references differently inside the editor', async () => {
    const input = await startFormulaEdit()

    act(() => setContenteditableText(input, '=A1+C2'))
    await act(async () => { await Promise.resolve() })

    const tokens = [...input.querySelectorAll<HTMLElement>('.formula-token')]
    expect(tokens.map((token) => token.textContent)).toEqual(['A1', 'C2'])
    expect(tokens.map((token) => token.classList.contains('formula-ref-0'))).toEqual([true, false])
    expect(tokens.map((token) => token.classList.contains('formula-ref-1'))).toEqual([false, true])
  })

  it('starts formula reference picking again after committing a previous formula edit', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))
    act(() => keyDown(input, 'Enter'))

    const b2 = gridCells()[11]
    act(() => mouseClick(b2))
    act(() => keyDown(b2, 'F2'))
    const nextInput = cellEditor()!
    act(() => setContenteditableText(nextInput, '='))
    act(() => keyDown(nextInput, 'ArrowRight'))

    expect(nextInput.textContent).toBe('=C2')
    const picked = document.querySelector<HTMLElement>('.cell.formula-ref-0')
    expect(picked?.dataset.formulaRef).toBe('C2')
  })

  it('extends the inserted reference to a range with Shift+Arrow', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))
    act(() => keyDown(input, 'ArrowDown', { shiftKey: true }))

    expect(input.textContent).toBe('=B1:B2')
    const selected = [...document.querySelectorAll<HTMLElement>('.cell.selected')]
    expect(selected).toHaveLength(2)
    expect(selected.map((cell) => cell.dataset.formulaRefIndex)).toEqual(['0', '0'])
    expect(selected.every((cell) => cell.classList.contains('formula-ref-0'))).toBe(true)
  })

  it('inserts a clicked cell reference without leaving formula edit', async () => {
    const input = await startFormulaEdit()
    const b2 = gridCells()[11]

    act(() => mouseClick(b2))

    expect(cellEditor()).toBe(input)
    expect(input.textContent).toBe('=B2')
  })

  it('cycles the picked reference with F4 while editing a formula', async () => {
    const input = await startFormulaEdit()

    act(() => keyDown(input, 'ArrowRight'))
    act(() => keyDown(input, 'F4'))
    act(() => keyDown(input, 'F4'))

    expect(input.textContent).toBe('=B$1')
  })
})
