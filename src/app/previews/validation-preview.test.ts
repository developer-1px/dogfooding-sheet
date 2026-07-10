import { act, createElement } from 'react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { mouseClick, setInputValue, setupReactDOM } from '../../shared/testing/test-utils'

const dom = setupReactDOM()

describe('validation preview interactions', () => {
  it('applies and clears dropdown validation without changing the cell value', async () => {
    await act(async () => dom.root.render(createElement(App)))
    const a2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    const validationButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '유효성')

    expect(a2?.textContent).toContain('Apple')
    expect(validationButton).not.toBeUndefined()

    act(() => mouseClick(a2))
    act(() => mouseClick(validationButton!))
    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="list"]')!))
    act(() => setInputValue(document.querySelector<HTMLTextAreaElement>('textarea[aria-label="드롭다운 항목"]')!, 'Open\nClosed'))
    act(() => mouseClick(document.querySelector<HTMLButtonElement>('button[aria-label="A2 데이터 유효성 적용"]')!))

    const dropdownA2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    expect(dropdownA2.getAttribute('aria-haspopup')).toBe('listbox')
    expect(dropdownA2.textContent).toContain('Apple')

    act(() => mouseClick(validationButton!))
    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="none"]')!))
    act(() => mouseClick(document.querySelector<HTMLButtonElement>('button[aria-label="A2 데이터 유효성 적용"]')!))

    const plainA2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    expect(plainA2.hasAttribute('aria-haspopup')).toBe(false)
    expect(plainA2.textContent).toContain('Apple')
  })

  it('converts a selected cell to an unchecked FALSE checkbox', async () => {
    await act(async () => dom.root.render(createElement(App)))
    const a2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    const validationButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent === '유효성')

    expect(a2?.textContent).toContain('Apple')
    expect(validationButton).not.toBeUndefined()

    act(() => mouseClick(a2))
    act(() => mouseClick(validationButton!))
    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="checkbox"]')!))
    act(() => mouseClick(document.querySelector<HTMLButtonElement>('button[aria-label="A2 데이터 유효성 적용"]')!))

    const updatedA2 = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')][10]
    const checkbox = updatedA2.querySelector<HTMLInputElement>('input[type="checkbox"]')
    expect(checkbox).not.toBeNull()
    expect(checkbox?.checked).toBe(false)
    expect(document.querySelector<HTMLInputElement>('input.formula')?.value).toBe('FALSE')
  })
})
