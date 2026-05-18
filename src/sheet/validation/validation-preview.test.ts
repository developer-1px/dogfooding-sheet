import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../../App'
import { mouseClick, setupReactDOM } from '../test-utils'
import { normalizeCheckboxValue } from './useValidation'

const dom = setupReactDOM()

describe('validation preview interactions', () => {
  it('normalizes existing values when converting cells to checkboxes', () => {
    expect(normalizeCheckboxValue(undefined)).toBe('FALSE')
    expect(normalizeCheckboxValue('')).toBe('FALSE')
    expect(normalizeCheckboxValue('1')).toBe('TRUE')
    expect(normalizeCheckboxValue('yes')).toBe('TRUE')
    expect(normalizeCheckboxValue('FALSE')).toBe('FALSE')
  })

  it('does not crash when the list validation button is clicked with the mouse', async () => {
    await act(async () => dom.root.render(createElement(App)))
    window.prompt = () => { throw new Error('prompt() is not supported') }

    const list = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '▾목록')

    expect(list).not.toBeUndefined()

    expect(() => {
      act(() => mouseClick(list!))
    }).not.toThrow()
  })

  it('converts a selected cell to an unchecked FALSE checkbox', async () => {
    await act(async () => dom.root.render(createElement(App)))
    const a2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    const checkboxButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '☑체크')

    expect(a2?.textContent).toContain('Apple')
    expect(checkboxButton).not.toBeUndefined()

    act(() => mouseClick(a2))
    act(() => mouseClick(checkboxButton!))

    const updatedA2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    const checkbox = updatedA2.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(checkbox).not.toBeNull()
    expect(checkbox?.checked).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input.formula')?.value).toBe('FALSE')
  })
})
