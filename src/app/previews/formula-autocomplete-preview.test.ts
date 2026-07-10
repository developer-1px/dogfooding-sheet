import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cellEditor, cells as gridCells, keyDown, mouseClick, setContenteditableText, setupReactDOM } from '../../shared/testing/test-utils'

const dom = setupReactDOM()

const startInlineFormula = async () => {
  await act(async () => dom.root.render(createElement(App)))
  const a1 = gridCells()[0]!
  act(() => mouseClick(a1))
  act(() => keyDown(a1, 'F2'))
  const editor = cellEditor()!
  act(() => setContenteditableText(editor, '=su'))
  return editor
}

describe('formula autocomplete preview interactions', () => {
  it('accepts a keyboard-selected function without leaving inline edit', async () => {
    const editor = await startInlineFormula()

    expect(editor.getAttribute('role')).toBe('combobox')
    expect(editor.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[role="option"][aria-selected="true"]')?.textContent).toBe('SUM')

    act(() => keyDown(editor, 'ArrowDown'))
    expect(document.querySelector('[role="option"][aria-selected="true"]')?.textContent).toBe('SUMIF')

    act(() => keyDown(editor, 'Enter'))
    expect(cellEditor()).toBe(editor)
    expect(editor.textContent).toBe('=SUMIF(')
    expect(document.activeElement).toBe(editor)
  })

  it('dismisses suggestions before Escape cancels inline edit', async () => {
    const editor = await startInlineFormula()

    act(() => keyDown(editor, 'Escape'))
    expect(cellEditor()).toBe(editor)
    expect(editor.textContent).toBe('=su')
    expect(document.querySelector('[role="listbox"]')).toBeNull()

    act(() => keyDown(editor, 'Escape'))
    expect(cellEditor()).toBeNull()
  })
})
