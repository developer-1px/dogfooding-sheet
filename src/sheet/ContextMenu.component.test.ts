import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { ContextMenu } from './ContextMenu'
import { keyDown, setupReactDOM } from './test-utils'

const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

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
          { label: '열기 (Alt+Shift+M)', onClick: onOpen, keyShortcuts: 'Alt+Shift+M' },
          'separator',
          { label: '삭제 (Delete)', onClick: onDisabled, disabled: true, disabledLabel: '삭제할 항목 없음', keyShortcuts: 'Delete' },
        ],
        onClose,
      }),
    )))

    const menu = document.querySelector<HTMLElement>('.ctx-menu')
    const separator = document.querySelector<HTMLElement>('.ctx-sep')
    const items = [...document.querySelectorAll<HTMLButtonElement>('.ctx-item')]

    expect(menu?.getAttribute('role')).toBe('menu')
    expect(menu?.getAttribute('aria-label')).toBe('셀 메뉴')
    expect(menu?.style.left).toBe('max(var(--sheet-space-1, 4px), min(12px, calc(100vw - 180px - var(--sheet-space-8, 24px))))')
    expect(menu?.style.top).toBe('max(var(--sheet-space-1, 4px), min(34px, calc(100vh - var(--sheet-space-8, 24px))))')
    expect(menu?.style.maxWidth).toBe('max(180px, calc(100vw - 12px - var(--sheet-space-8, 24px)))')
    expect(menu?.style.maxHeight).toBe('max(var(--sheet-space-8, 24px), calc(100vh - 34px - var(--sheet-space-8, 24px)))')
    expect(separator?.getAttribute('role')).toBe('separator')
    expect(separator?.textContent).toBe('')
    expect(items.map((item) => item.textContent)).toEqual(['열기 (Alt+Shift+M)', '삭제'])
    expect(items.every((item) => item.type === 'button')).toBe(true)
    expect(items[0]?.getAttribute('title')).toBe('열기 (Alt+Shift+M)')
    expect(items[0]?.getAttribute('aria-label')).toBe('열기 (Alt+Shift+M)')
    expect(items[0]?.getAttribute('aria-keyshortcuts')).toBe('Alt+Shift+M')
    expect(items[1]?.getAttribute('title')).toBe('삭제할 항목 없음')
    expect(items[1]?.getAttribute('aria-label')).toBe('삭제할 항목 없음')
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

  it('keeps context menu vertical position inside viewport padding', () => {
    act(() => dom.root.render(createElement(ContextMenu, {
      x: -10,
      y: -20,
      label: '셀 메뉴',
      items: [{ label: '열기', onClick: vi.fn() }],
      onClose: vi.fn(),
    })))

    const menu = document.querySelector<HTMLElement>('.ctx-menu')

    expect(menu?.style.left).toBe('max(var(--sheet-space-1, 4px), min(0px, calc(100vw - 180px - var(--sheet-space-8, 24px))))')
    expect(menu?.style.top).toBe('max(var(--sheet-space-1, 4px), min(0px, calc(100vh - var(--sheet-space-8, 24px))))')
    expect(menu?.style.maxWidth).toBe('max(180px, calc(100vw - 0px - var(--sheet-space-8, 24px)))')
    expect(menu?.style.maxHeight).toBe('max(var(--sheet-space-8, 24px), calc(100vh - 0px - var(--sheet-space-8, 24px)))')
  })

  it('falls back to the generic unavailable label for disabled menu items without a reason', () => {
    const onDisabled = vi.fn()

    act(() => dom.root.render(createElement(ContextMenu, {
      x: 0,
      y: 0,
      items: [{ label: '삭제', onClick: onDisabled, disabled: true }],
      onClose: vi.fn(),
    })))

    const disabled = document.querySelector<HTMLButtonElement>('.ctx-item')

    expect(disabled?.textContent).toBe('삭제')
    expect(disabled?.disabled).toBe(true)
    expect(disabled?.getAttribute('title')).toBe('삭제 사용할 수 없음')
    expect(disabled?.getAttribute('aria-label')).toBe('삭제 사용할 수 없음')
  })

  it('keeps menu item activation keys inside the context menu controls', () => {
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(ContextMenu, {
        x: 12,
        y: 34,
        label: '셀 메뉴',
        items: [{ label: '열기', onClick: vi.fn() }],
        onClose: vi.fn(),
      }),
    )))

    const item = document.querySelector<HTMLButtonElement>('.ctx-item')

    expect(item?.textContent).toBe('열기')

    act(() => keyDown(item!, 'Enter'))
    act(() => keyDown(item!, ' '))

    expect(parentKeys).toEqual([])
  })

  it('keeps long context menus vertically scrollable and horizontally clipped', () => {
    const css = overlaysCss()
    const menuRule = css.match(/\.ctx-menu\s*\{[^}]+\}/)?.[0] ?? ''

    expect(menuRule).toContain('overflow-x: hidden;')
    expect(menuRule).toContain('overflow-y: auto;')
  })

  it('keeps long context menu labels contained on narrow viewports', () => {
    const css = overlaysCss()

    expect(css).toContain('overflow: hidden; text-overflow: ellipsis; white-space: nowrap;')
  })
})
