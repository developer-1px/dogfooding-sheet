import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OverflowMenu } from './OverflowMenu'
import type { Confirm } from './useConfirm'
import { initialSheet, type Sheet } from './schema'

describe('OverflowMenu component', () => {
  let host: HTMLDivElement
  let root: Root
  const emptySheet: Sheet = { ...initialSheet, cells: {}, styles: {}, formats: {}, condFormat: [] }

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    act(() => root.unmount())
    host.remove()
  })

  const renderOverflowMenu = (sheet: Sheet = emptySheet, options: { canInsertLink?: boolean; insertLink?: () => void } = {}) => {
    const confirm: Confirm = () => Promise.resolve(false)
    const { canInsertLink = true, insertLink = () => {} } = options

    act(() => root.render(createElement(OverflowMenu, {
      display: () => '',
      writeCell: () => {},
      writeCells: () => {},
      writeCellRange: () => false,
      openHelp: () => {},
      insertLink,
      canInsertLink,
      sheet,
      applySheetReplacement: () => false,
      clearCellValues: () => false,
      confirm,
      showFormulas: false,
      toggleShowFormulas: () => {},
      showGridlines: true,
      toggleShowGridlines: () => {},
      clearAllFormats: () => false,
    })))
  }

  it('labels the compact trigger and keeps menu-button relationships', () => {
    renderOverflowMenu()

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    expect(trigger).not.toBeNull()
    expect(trigger?.type).toBe('button')
    expect(trigger?.textContent).toBe('⋮')
    expect(trigger?.getAttribute('aria-label')).toBe('더 보기 메뉴 열기')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger?.getAttribute('aria-expanded')).toBe('false')
    expect(trigger?.getAttribute('aria-controls')).toBeTruthy()

    act(() => trigger!.click())

    expect(trigger?.getAttribute('aria-label')).toBe('더 보기 메뉴 닫기')
    expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    expect(document.querySelector('.overflow-list')?.getAttribute('role')).toBe('menu')
    const items = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.type === 'button')).toBe(true)
    expect(items.find((item) => item.textContent === '도움말 (F1)')?.getAttribute('title')).toBe('도움말 (F1)')
    expect(items.find((item) => item.textContent === '도움말 (F1)')?.getAttribute('aria-keyshortcuts')).toBe('F1')
    expect(items.find((item) => item.textContent === '수식 표시 (Ctrl/⌘+`)')?.getAttribute('title')).toBe('수식 표시 (Ctrl/⌘+`)')
    expect(items.find((item) => item.textContent === '수식 표시 (Ctrl/⌘+`)')?.getAttribute('aria-keyshortcuts')).toBe('Control+` Meta+`')
    expect(items.find((item) => item.textContent === '하이퍼링크 삽입 (Ctrl/⌘+K)')?.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K')
    expect(items.find((item) => item.textContent === '인쇄 (Ctrl/⌘+P)')?.getAttribute('aria-keyshortcuts')).toBe('Control+P Meta+P')
    expect(items.find((item) => item.textContent === 'CSV 내보내기 (Ctrl/⌘+S)')?.getAttribute('aria-keyshortcuts')).toBe('Control+S Meta+S')
    expect(items.find((item) => item.textContent === 'CSV 가져오기')?.getAttribute('title')).toBe('CSV 가져오기')
    expect(items.find((item) => item.textContent === 'CSV 가져오기')?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('disables hyperlink insertion when there is no focused cell target', () => {
    const insertLink = vi.fn()

    renderOverflowMenu(emptySheet, { canInsertLink: false, insertLink })

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    act(() => trigger!.click())

    const link = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '하이퍼링크 삽입 (Ctrl/⌘+K)')

    expect(link?.disabled).toBe(true)
    expect(link?.getAttribute('aria-disabled')).toBe('true')
    expect(link?.getAttribute('title')).toBe('하이퍼링크 삽입 (Ctrl/⌘+K)')
    expect(link?.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K')

    act(() => link!.click())

    expect(insertLink).not.toHaveBeenCalled()
  })

  it('keeps hyperlink insertion enabled when a focused cell target exists', () => {
    renderOverflowMenu(emptySheet, { canInsertLink: true })

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    act(() => trigger!.click())

    const link = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '하이퍼링크 삽입 (Ctrl/⌘+K)')

    expect(link?.disabled).toBe(false)
    expect(link?.hasAttribute('aria-disabled')).toBe(false)
    expect(link?.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K')
  })

  it('disables destructive clear items when the sheet has nothing to clear', () => {
    renderOverflowMenu()

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    act(() => trigger!.click())

    const clearValues = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '전체 값 지우기')
    const clearFormats = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '전체 서식 지우기')

    expect(clearValues?.disabled).toBe(true)
    expect(clearValues?.getAttribute('aria-disabled')).toBe('true')
    expect(clearValues?.getAttribute('title')).toBe('전체 값 지우기')
    expect(clearFormats?.disabled).toBe(true)
    expect(clearFormats?.getAttribute('aria-disabled')).toBe('true')
    expect(clearFormats?.getAttribute('title')).toBe('전체 서식 지우기')
  })

  it('enables destructive clear items when matching sheet data exists', () => {
    renderOverflowMenu({
      ...emptySheet,
      cells: { A1: 'value' },
      styles: { A1: { b: true } },
    })

    const trigger = document.querySelector<HTMLButtonElement>('.overflow-trigger')
    act(() => trigger!.click())

    const clearValues = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '전체 값 지우기')
    const clearFormats = [...document.querySelectorAll<HTMLButtonElement>('.overflow-item')]
      .find((item) => item.textContent === '전체 서식 지우기')

    expect(clearValues?.disabled).toBe(false)
    expect(clearFormats?.disabled).toBe(false)
  })
})
