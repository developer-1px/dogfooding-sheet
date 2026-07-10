import { act, createElement, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { applyFormulaFunctionCompletion, type FormulaFunctionCompletion } from '@spredsheet/formula'
import { keyDown, setupReactDOM } from '../../../shared/testing/test-utils'
import { useFormulaAutocomplete } from '../hooks/useFormulaAutocomplete'
import { FormulaAutocompleteList } from './FormulaAutocompleteList'

const dom = setupReactDOM()

function Harness({ initial = '=su' }: { initial?: string }) {
  const [formula, setFormula] = useState(initial)
  const autocomplete = useFormulaAutocomplete({
    formula,
    caretOffset: formula.length,
    onAccept: (completion: FormulaFunctionCompletion) => {
      setFormula(applyFormulaFunctionCompletion(formula, completion).formula)
    },
  })

  return createElement(
    'div',
    null,
    createElement('input', {
      className: 'editor',
      value: formula,
      readOnly: true,
      ...autocomplete.comboboxProps,
      onKeyDown: autocomplete.onKeyDown,
    }),
    createElement(FormulaAutocompleteList, { autocomplete }),
    createElement('output', null, formula),
  )
}

describe('FormulaAutocompleteList', () => {
  it('exposes listbox semantics and accepts the active option with the keyboard', () => {
    act(() => dom.root.render(createElement(Harness)))

    const editor = document.querySelector<HTMLInputElement>('.editor')!
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')]

    expect(editor.getAttribute('role')).toBe('combobox')
    expect(editor.getAttribute('aria-autocomplete')).toBe('list')
    expect(editor.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-label')).toBe('수식 함수 제안')
    expect(options[0]?.textContent).toBe('SUM')
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')

    act(() => keyDown(editor, 'ArrowUp'))
    expect(options.at(-1)?.getAttribute('aria-selected')).toBe('true')

    act(() => keyDown(editor, 'ArrowDown'))
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')

    act(() => keyDown(editor, 'ArrowDown'))
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')

    act(() => keyDown(editor, 'Enter'))
    expect(document.querySelector('output')?.textContent).toBe('=SUMIF(')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })

  it('accepts the active option with Tab', () => {
    act(() => dom.root.render(createElement(Harness)))

    const editor = document.querySelector<HTMLInputElement>('.editor')!
    act(() => keyDown(editor, 'Tab'))

    expect(document.querySelector('output')?.textContent).toBe('=SUM(')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
  })

  it('dismisses suggestions with Escape until the formula changes', () => {
    act(() => dom.root.render(createElement(Harness)))

    const editor = document.querySelector<HTMLInputElement>('.editor')!
    act(() => keyDown(editor, 'Escape'))

    expect(editor.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    expect(document.querySelector('output')?.textContent).toBe('=su')
  })

  it('accepts a pointer-selected option without moving focus', () => {
    act(() => dom.root.render(createElement(Harness, { initial: '=sump' })))

    const editor = document.querySelector<HTMLInputElement>('.editor')!
    act(() => editor.focus())
    const option = document.querySelector<HTMLElement>('[role="option"]')!
    act(() => option.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true })))

    expect(document.activeElement).toBe(editor)
    expect(document.querySelector('output')?.textContent).toBe('=SUMPRODUCT(')
  })
})
