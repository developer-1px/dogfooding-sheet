import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { keyDown, setupReactDOM } from './test-utils'

const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

describe('ConfirmDialog component', () => {
  const dom = setupReactDOM()

  it('describes the alert dialog with its visible message', () => {
    act(() => dom.root.render(createElement(ConfirmDialog, {
      open: true,
      message: '선택한 시트를 삭제하시겠습니까?',
      confirmLabel: '삭제',
      cancelLabel: '취소',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })))

    const dialog = document.querySelector<HTMLElement>('.confirm-dialog')
    const messageId = dialog?.getAttribute('aria-describedby')
    const message = messageId ? document.getElementById(messageId) : null

    expect(dialog?.getAttribute('role')).toBe('alertdialog')
    expect(dialog?.getAttribute('aria-label')).toBe('삭제 확인')
    expect(messageId).toBeTruthy()
    expect(message?.textContent).toBe('선택한 시트를 삭제하시겠습니까?')
  })

  it('keeps cancel and confirm actions wired to buttons', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(ConfirmDialog, {
        open: true,
        message: '삭제할까요?',
        confirmLabel: '삭제',
        cancelLabel: '아니요',
        onConfirm,
        onCancel,
      }),
    )))

    const cancel = document.querySelector<HTMLButtonElement>('.confirm-actions button:not(.danger)')
    const confirm = document.querySelector<HTMLButtonElement>('.confirm-actions .danger')
    const backdrop = document.querySelector<HTMLElement>('.dialog-backdrop')

    expect(backdrop?.getAttribute('aria-hidden')).toBe('true')
    expect(cancel?.type).toBe('button')
    expect(cancel?.textContent).toBe('아니요')
    expect(cancel?.getAttribute('aria-label')).toBe('삭제 확인: 아니요')
    expect(cancel?.getAttribute('title')).toBe('삭제 확인: 아니요 (Esc)')
    expect(cancel?.getAttribute('aria-keyshortcuts')).toBe('Escape')
    expect(confirm?.type).toBe('button')
    expect(confirm?.textContent).toBe('삭제')
    expect(confirm?.getAttribute('aria-label')).toBe('삭제 확인: 삭제')
    expect(confirm?.getAttribute('title')).toBe('삭제 확인: 삭제 (Enter)')
    expect(confirm?.getAttribute('aria-keyshortcuts')).toBe('Enter')

    act(() => keyDown(cancel!, 'Enter'))
    act(() => keyDown(confirm!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(cancel!, 'Escape'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    act(() => cancel!.click())
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()

    act(() => backdrop!.click())
    expect(onCancel).toHaveBeenCalledTimes(3)
    expect(onConfirm).not.toHaveBeenCalled()

    act(() => confirm!.click())
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('keeps action dialogs constrained to the viewport', () => {
    const css = overlaysCss()

    expect(css).toContain('min-width: min(320px, calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px)))')
    expect(css).toContain('max-width: calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px))')
    expect(css).toContain('max-height: calc(100vh - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px))')
    expect(css.match(/overflow: auto/g)?.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps confirm dialog actions contained on narrow viewports', () => {
    const css = overlaysCss()

    expect(css).toContain('.confirm-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--sheet-space-3, 8px); }')
    expect(css).toContain('.confirm-actions button { max-width: 100%; overflow-wrap: anywhere; }')
  })

  it('keeps confirm dialog messages contained on narrow viewports', () => {
    const css = overlaysCss()

    expect(css).toContain('.confirm-dialog p { margin: 0 0 var(--sheet-space-6, 16px); font-size: var(--sheet-font-size-control, 14px); overflow-wrap: anywhere; }')
  })
})
