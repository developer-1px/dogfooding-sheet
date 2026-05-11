import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { cellByText, cells as gridCells, setupReactDom } from './test-utils'

const dom = setupReactDom()

describe('cell edit: Backspace deletes character inside the input', () => {
  it('regression aria-kernel#140: Backspace inside cell-input is not preventDefault()-d by grid root', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const apple = cellByText('Apple')!
    act(() => {
      apple.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      apple.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
      apple.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    })
    act(() => apple.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'F2' })))
    const input = document.querySelector<HTMLInputElement>('input.cell-input')!
    expect(input).not.toBeNull()

    const ke = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Backspace' })
    act(() => { input.dispatchEvent(ke) })

    expect(ke.defaultPrevented, 'Backspace must not be PD-ed by grid built-in chord').toBe(false)
  })


  it('typing then Backspace shrinks the draft', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const apple = cellByText('Apple')!
    act(() => apple.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
    act(() => apple.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 })))
    act(() => apple.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 })))

    // Press F2 to start edit
    act(() => apple.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'F2' })))

    const input = document.querySelector<HTMLInputElement>('input.cell-input')
    expect(input, 'input should mount on edit').not.toBeNull()
    expect(input!.value).toBe('Apple')

    // Backspace inside the input — simulate native: dispatch keydown then mutate value via setter.
    act(() => input!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Backspace' })))
    // jsdom doesn't auto-mutate input.value on Backspace keydown — emulate browser by setting value.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(input, 'Appl'); input!.dispatchEvent(new Event('input', { bubbles: true })) })

    expect(input!.value, 'input.value should reflect deletion').toBe('Appl')
  })

  it('typed-letter-start: pressing Backspace after starting edit by typing should delete the letter', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const empty = gridCells().find((c) => c.textContent?.trim() === '')!
    act(() => empty.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
    act(() => empty.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 })))
    act(() => empty.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 })))

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' })))

    const input = document.querySelector<HTMLInputElement>('input.cell-input')
    expect(input).not.toBeNull()
    expect(input!.value).toBe('a')

    act(() => input!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Backspace' })))
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => { setter.call(input, ''); input!.dispatchEvent(new Event('input', { bubbles: true })) })

    expect(input!.value).toBe('')
  })

  it('FormulaBar: Backspace inside formula input does NOT clear the focused cell', async () => {
    await act(async () => dom.root.render(createElement(App)))

    const apple = cellByText('Apple')!
    act(() => apple.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })))
    act(() => apple.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 })))
    act(() => apple.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 })))

    const fbar = document.querySelector<HTMLInputElement>('input.formula')
    expect(fbar).not.toBeNull()
    fbar!.focus()
    expect(document.activeElement).toBe(fbar)

    act(() => fbar!.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Backspace' })))

    // The Apple cell should still show its content — the cell-clear shortcut must not have fired.
    expect(apple.textContent).toContain('Apple')
  })
})
