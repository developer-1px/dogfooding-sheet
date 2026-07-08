import { act, createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu } from './ContextMenu'
import { setupReactDOM } from './test-utils'

describe('ContextMenu component', () => {
  const dom = setupReactDOM()

  it('renders non-submit menu item buttons and keeps click actions wired', () => {
    const onOpen = vi.fn()
    const onDisabled = vi.fn()
    const onClose = vi.fn()
    const onGridKeyDown = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: onGridKeyDown },
      createElement(ContextMenu, {
        x: 12,
        y: 34,
        label: '셀 메뉴',
        items: [
          { label: '열기', onClick: onOpen, keyShortcuts: 'Alt+Shift+M' },
          'separator',
          { label: '삭제', onClick: onDisabled, disabled: true },
        ],
        onClose,
      }),
    )))

    const menu = document.querySelector<HTMLElement>('.ctx-menu')
    const separator = document.querySelector<HTMLElement>('.ctx-sep')
    const items = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]

    expect(menu?.getAttribute('role')).toBe('menu')
    expect(menu?.getAttribute('aria-label')).toBe('셀 메뉴')
    expect(separator?.getAttribute('role')).toBe('separator')
    expect(separator?.textContent).toBe('')
    expect(items.map((item) => item.textContent)).toEqual(['열기', '삭제'])
    expect(items.every((item) => item.type === 'button')).toBe(true)
    expect(items[0]?.getAttribute('title')).toBe('열기')
    expect(items[0]?.getAttribute('aria-label')).toBe('열기')
    expect(items[0]?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')
    expect(items[1]?.getAttribute('title')).toBe('삭제 사용할 수 없음')
    expect(items[1]?.getAttribute('aria-label')).toBe('삭제 사용할 수 없음')
    expect(items[1]?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(items[1]?.disabled).toBe(true)

    act(() => items[1]!.click())
    act(() => items[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true })))

    expect(onDisabled).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    const arrowDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' })
    act(() => items[0]!.dispatchEvent(arrowDown))
    expect(onGridKeyDown).not.toHaveBeenCalled()

    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })
    act(() => items[0]!.dispatchEvent(escape))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onGridKeyDown).not.toHaveBeenCalled()

    act(() => items[0]!.click())

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(2)
    expect(onDisabled).not.toHaveBeenCalled()
  })
})
