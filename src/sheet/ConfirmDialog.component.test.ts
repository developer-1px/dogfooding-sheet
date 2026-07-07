import { act, createElement, type KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'
import { keyDown, setupReactDOM } from './test-utils'

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

    expect(cancel?.type).toBe('button')
    expect(cancel?.textContent).toBe('아니요')
    expect(cancel?.getAttribute('title')).toBe('아니요 (Esc)')
    expect(cancel?.getAttribute('aria-keyshortcuts')).toBe('Escape')
    expect(confirm?.type).toBe('button')
    expect(confirm?.textContent).toBe('삭제')
    expect(confirm?.getAttribute('title')).toBe('삭제')

    act(() => keyDown(cancel!, 'Enter'))
    act(() => keyDown(confirm!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(cancel!, 'Escape'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    act(() => cancel!.click())
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()

    act(() => confirm!.click())
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
