import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { PromptDialog } from './PromptDialog'
import { keyDown, setInputValue, setupReactDOM } from './test-utils'

const appCss = () => readFileSync('src/App.css', 'utf8')
const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

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
    expect(input?.getAttribute('title')).toBe('허용 값 (Enter=적용 / Esc=취소)')
    expect(input?.getAttribute('aria-keyshortcuts')).toBe('Enter Escape')
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

    const backdrop = document.querySelector<HTMLElement>('.dialog-backdrop')
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true')

    const cancel = document.querySelector<HTMLButtonElement>('.prompt-dialog button:not(.primary)')
    expect(cancel?.type).toBe('button')
    expect(cancel?.textContent).toBe('취소')
    expect(cancel?.getAttribute('aria-label')).toBe('필터 취소')
    expect(cancel?.getAttribute('title')).toBe('필터 취소 (Esc)')
    expect(cancel?.getAttribute('aria-keyshortcuts')).toBe('Escape')

    const submit = document.querySelector<HTMLButtonElement>('.prompt-dialog .primary')
    expect(submit?.getAttribute('aria-label')).toBe('필터 적용')
    expect(submit?.getAttribute('title')).toBe('필터 적용 (Enter)')
    expect(submit?.getAttribute('aria-keyshortcuts')).toBe('Enter')

    act(() => keyDown(submit!, 'Enter'))
    act(() => keyDown(cancel!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(cancel!, 'Escape'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    act(() => cancel!.click())
    expect(onCancel).toHaveBeenCalledTimes(2)

    act(() => backdrop!.click())
    expect(onCancel).toHaveBeenCalledTimes(3)
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
    expect(input.getAttribute('title')).toBe('하이퍼링크 URL (Enter=삽입 / Esc=취소)')
    expect(input.getAttribute('aria-keyshortcuts')).toBe('Enter Escape')

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

  it('keeps prompt inputs contained on narrow viewports', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const inputRule = css.match(/\.prompt-dialog input\s*\{[^}]+\}/)?.[0] ?? ''
    const inputFocusRule = css.match(/\.prompt-dialog input:focus\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-size-prompt-input-border: 1px;')
    expect(rootCss).toContain('--sheet-focus-ring: 2px solid var(--sheet-color-accent);')
    expect(rootCss).toContain('--sheet-focus-offset: 2px;')
    expect(css).toContain('.prompt-dialog input { min-width: 0; max-width: 100%;')
    expect(inputRule).toContain('border: var(--sheet-size-prompt-input-border, 1px) solid var(--sheet-color-border, #dadce0);')
    expect(inputFocusRule).toContain('border-color: var(--sheet-color-accent, #1a73e8);')
    expect(inputFocusRule).toContain('outline: var(--sheet-focus-ring, 2px solid #1a73e8);')
    expect(inputFocusRule).toContain('outline-offset: var(--sheet-focus-offset, 2px);')
    expect(inputFocusRule).not.toContain('outline: none;')
  })

  it('keeps prompt dialogs constrained to the viewport', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const promptDialogRule = css.match(/\.prompt-dialog\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-size-dialog-width: 320px;')
    expect(promptDialogRule).toContain('min-width: min(var(--sheet-size-dialog-width, 320px), max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px))))')
    expect(promptDialogRule).toContain('max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px)))')
    expect(promptDialogRule).toContain('max-height: max(var(--sheet-space-8, 24px), calc(100vh - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px)))')
    expect(promptDialogRule).toContain('overflow: auto')
  })

  it('keeps prompt labels contained on narrow viewports', () => {
    const css = overlaysCss()

    expect(css).toContain('.prompt-dialog label { font-size: var(--sheet-font-size-ui, 13px); color: var(--sheet-color-muted, #5f6368); overflow-wrap: anywhere; }')
  })
})
