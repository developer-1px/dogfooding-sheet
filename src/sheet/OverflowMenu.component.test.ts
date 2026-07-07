import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { OverflowMenu } from './OverflowMenu'
import type { Confirm } from './useConfirm'
import type { Sheet } from './schema'

describe('OverflowMenu component', () => {
  let host: HTMLDivElement
  let root: Root

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

  const renderOverflowMenu = () => {
    const confirm: Confirm = () => Promise.resolve(false)

    act(() => root.render(createElement(OverflowMenu, {
      display: () => '',
      writeCell: () => {},
      writeCells: () => {},
      writeCellRange: () => false,
      openHelp: () => {},
      insertLink: () => {},
      sheet: {} as Sheet,
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
    expect(items.find((item) => item.textContent === '도움말 (F1)')?.getAttribute('aria-keyshortcuts')).toBe('F1')
    expect(items.find((item) => item.textContent === '수식 표시 (Ctrl/⌘+`)')?.getAttribute('aria-keyshortcuts')).toBe('Control+` Meta+`')
    expect(items.find((item) => item.textContent === '하이퍼링크 삽입 (Ctrl/⌘+K)')?.getAttribute('aria-keyshortcuts')).toBe('Control+K Meta+K')
    expect(items.find((item) => item.textContent === '인쇄 (Ctrl/⌘+P)')?.getAttribute('aria-keyshortcuts')).toBe('Control+P Meta+P')
    expect(items.find((item) => item.textContent === 'CSV 내보내기 (Ctrl/⌘+S)')?.getAttribute('aria-keyshortcuts')).toBe('Control+S Meta+S')
    expect(items.find((item) => item.textContent === 'CSV 가져오기')?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })
})
