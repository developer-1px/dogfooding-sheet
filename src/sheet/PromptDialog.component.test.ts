import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PromptDialog } from './PromptDialog'
import { keyDown, setInputValue, setupReactDOM } from './test-utils'

describe('PromptDialog component', () => {
  const dom = setupReactDOM()

  it('associates the visible prompt label with the input', () => {
    act(() => dom.root.render(createElement(PromptDialog, {
      open: true,
      label: '허용 값',
      placeholder: 'A,B,C',
      initial: 'A',
      submitLabel: '적용',
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    })))

    const label = document.querySelector<HTMLLabelElement>('.prompt-dialog label')
    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')

    expect(label?.textContent).toBe('허용 값')
    expect(input?.id).toBeTruthy()
    expect(label?.htmlFor).toBe(input?.id)
    expect(input?.placeholder).toBe('A,B,C')
    expect(input?.value).toBe('A')
  })

  it('keeps submit, Enter, and cancel interactions unchanged', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()

    act(() => dom.root.render(createElement(PromptDialog, {
      open: true,
      label: '필터',
      initial: 'old',
      submitLabel: '적용',
      onSubmit,
      onCancel,
    })))

    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')!
    act(() => setInputValue(input, 'next'))
    act(() => keyDown(input, 'Enter'))
    expect(onSubmit).toHaveBeenLastCalledWith('next')

    act(() => setInputValue(input, 'click'))
    act(() => document.querySelector<HTMLButtonElement>('.prompt-dialog .primary')!.click())
    expect(onSubmit).toHaveBeenLastCalledWith('click')

    act(() => document.querySelector<HTMLButtonElement>('.prompt-dialog button:not(.primary)')!.click())
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
