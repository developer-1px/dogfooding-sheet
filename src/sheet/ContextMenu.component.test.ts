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

    act(() => dom.root.render(createElement(ContextMenu, {
      x: 12,
      y: 34,
      label: '셀 메뉴',
      items: [
        { label: '열기', onClick: onOpen },
        { label: '삭제', onClick: onDisabled, disabled: true },
      ],
      onClose,
    })))

    const menu = document.querySelector<HTMLElement>('.ctx-menu')
    const items = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]

    expect(menu?.getAttribute('role')).toBe('menu')
    expect(menu?.getAttribute('aria-label')).toBe('셀 메뉴')
    expect(items.map((item) => item.textContent)).toEqual(['열기', '삭제'])
    expect(items.every((item) => item.type === 'button')).toBe(true)
    expect(items[1]?.disabled).toBe(true)

    act(() => items[0]!.click())

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onDisabled).not.toHaveBeenCalled()
  })
})
