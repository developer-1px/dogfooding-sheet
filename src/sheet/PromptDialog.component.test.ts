import { act, createElement, type KeyboardEvent } from 'react'
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
    expect(input?.getAttribute('aria-keyshortcuts')).toBe('Enter')
  })

  it('keeps submit, Enter, and cancel interactions unchanged', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(PromptDialog, {
        open: true,
        label: '필터',
        initial: 'old',
        submitLabel: '적용',
        onSubmit,
        onCancel,
      }),
    )))

    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')!
    act(() => setInputValue(input, 'next'))
    act(() => keyDown(input, 'Enter'))
    expect(onSubmit).toHaveBeenLastCalledWith('next')
    expect(parentKeys).toEqual([])

    act(() => setInputValue(input, 'click'))
    act(() => document.querySelector<HTMLButtonElement>('.prompt-dialog .primary')!.click())
    expect(onSubmit).toHaveBeenLastCalledWith('click')

    const cancel = document.querySelector<HTMLButtonElement>('.prompt-dialog button:not(.primary)')
    expect(cancel?.type).toBe('button')
    expect(cancel?.textContent).toBe('취소')
    expect(cancel?.getAttribute('title')).toBe('취소 (Esc)')
    expect(cancel?.getAttribute('aria-keyshortcuts')).toBe('Escape')

    const submit = document.querySelector<HTMLButtonElement>('.prompt-dialog .primary')
    expect(submit?.getAttribute('title')).toBe('적용 (Enter)')
    expect(submit?.getAttribute('aria-keyshortcuts')).toBe('Enter')

    act(() => keyDown(submit!, 'Enter'))
    act(() => keyDown(cancel!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(cancel!, 'Escape'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    act(() => cancel!.click())
    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it('keeps prompt input editing keys inside the input while preserving Escape cancel', () => {
    const onSubmit = vi.fn()
    const onCancel = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(PromptDialog, {
        open: true,
        label: '하이퍼링크 URL',
        placeholder: 'https://...',
        initial: 'https://example.com',
        submitLabel: '삽입',
        onSubmit,
        onCancel,
      }),
    )))

    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')!

    expect(input.placeholder).toBe('https://...')
    expect(input.value).toBe('https://example.com')
    expect(input.getAttribute('aria-keyshortcuts')).toBe('Enter')

    act(() => keyDown(input, 'ArrowLeft'))
    act(() => keyDown(input, 'x'))

    expect(parentKeys).toEqual([])
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()

    act(() => keyDown(input, 'Escape'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(parentKeys).toEqual([])
  })

  it('resets the input value when a new initial value is supplied', () => {
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
    act(() => setInputValue(input, 'typed'))

    act(() => dom.root.render(createElement(PromptDialog, {
      open: true,
      label: '필터',
      initial: 'new',
      submitLabel: '적용',
      onSubmit,
      onCancel,
    })))

    expect(document.querySelector<HTMLInputElement>('.prompt-dialog input')?.value).toBe('new')
  })
})
