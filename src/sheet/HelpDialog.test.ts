import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { keyDown, setupReactDOM } from './test-utils'
import { HelpDialog } from './HelpDialog'

const appCss = () => readFileSync('src/App.css', 'utf8')
const overlaysCss = () => readFileSync('src/sheet/overlays.css', 'utf8')

describe('HelpDialog', () => {
  const dom = setupReactDOM()

  it('documents shortcuts in a structured table', () => {
    const onClose = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(HelpDialog, {
        open: true,
        onClose,
      }),
    )))

    const dialog = document.querySelector<HTMLElement>('.help-dialog')
    const titleId = dialog?.getAttribute('aria-labelledby')
    const title = titleId ? document.getElementById(titleId) : null

    expect(dialog?.getAttribute('role')).toBe('dialog')
    expect(titleId).toBe('help-title')
    expect(title?.textContent).toBe('키보드 단축키')
    expect(document.querySelector('caption')?.textContent).toBe('키보드 단축키 목록')
    const columnHeaders = [...document.querySelectorAll('thead th')]
    expect(columnHeaders.map((th) => th.textContent)).toEqual(['단축키', '동작'])
    expect(columnHeaders.every((th) => th.getAttribute('scope') === 'col')).toBe(true)
    expect(document.querySelector('kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    const rowHeaders = [...document.querySelectorAll('tbody th[scope="row"]')]
    expect(rowHeaders[0]?.querySelector('kbd')?.textContent).toBe('Ctrl/⌘ + Z')
    expect(rowHeaders.length).toBeGreaterThan(0)
    expect(document.querySelector('tbody tr td')?.textContent).toBe('실행 취소')
    expect(document.body.textContent).toContain('F4 (수식 입력 중)')
    expect(document.body.textContent).toContain('마지막 셀 참조의 절대/상대 형식 순환')
    expect(document.body.textContent).toContain('찾기창 Enter / Shift+Enter / Esc')
    expect(document.body.textContent).toContain('다음 결과 / 이전 결과 / 찾기창 닫기')
    expect(document.body.textContent).toContain('행/열 헤더 드래그 또는 화살표')
    expect(document.body.textContent).toContain('너비/높이 조정 (Shift+화살표 = 크게 조정, 더블클릭 = 자동 맞춤 / 기본값 복원)')

    const backdrop = document.querySelector<HTMLElement>('.dialog-backdrop')
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true')

    const close = document.querySelector<HTMLButtonElement>('button[aria-label="키보드 단축키 도움말 닫기"]')
    expect(close?.textContent).toBe('닫기')
    expect(close?.type).toBe('button')
    expect(close?.getAttribute('title')).toBe('키보드 단축키 도움말 닫기 (Esc)')
    expect(close?.getAttribute('aria-keyshortcuts')).toBe('Escape')

    act(() => keyDown(close!, 'Enter'))
    act(() => keyDown(close!, ' '))
    expect(parentKeys).toEqual([])

    act(() => keyDown(close!, 'Escape'))
    expect(onClose).toHaveBeenCalledTimes(1)

    act(() => close!.click())
    expect(onClose).toHaveBeenCalledTimes(2)

    act(() => backdrop!.click())
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('keeps the shortcut dialog constrained to the viewport', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const helpDialogRule = css.match(/\.help-dialog\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-size-shortcut-dialog-width: 360px;')
    expect(helpDialogRule).toContain('min-width: min(var(--sheet-size-shortcut-dialog-width, 360px), max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px))))')
    expect(helpDialogRule).toContain('max-width: max(var(--sheet-space-8, 24px), calc(100vw - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px)))')
    expect(helpDialogRule).toContain('max-height: max(var(--sheet-space-8, 24px), calc(100vh - var(--sheet-space-8, 24px) - var(--sheet-space-8, 24px)))')
    expect(helpDialogRule).toContain('overflow: auto')
  })

  it('keeps dialog layers on design tokens', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const backdropRule = css.match(/\.dialog-backdrop\s*\{[^}]+\}/)?.[0] ?? ''
    const helpDialogRule = css.match(/\.help-dialog\s*\{[^}]+\}/)?.[0] ?? ''
    const promptDialogRule = css.match(/\.prompt-dialog\s*\{[^}]+\}/)?.[0] ?? ''
    const confirmDialogRule = css.match(/\.confirm-dialog\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-z-index-dialog-backdrop: 100;')
    expect(rootCss).toContain('--sheet-z-index-dialog: 101;')
    expect(backdropRule).toContain('z-index: var(--sheet-z-index-dialog-backdrop, 100);')
    expect(helpDialogRule).toContain('z-index: var(--sheet-z-index-dialog, 101);')
    expect(promptDialogRule).toContain('z-index: var(--sheet-z-index-dialog, 101);')
    expect(confirmDialogRule).toContain('z-index: var(--sheet-z-index-dialog, 101);')
    expect(backdropRule).not.toContain('z-index: 100;')
    expect(helpDialogRule).not.toContain('z-index: 101;')
    expect(promptDialogRule).not.toContain('z-index: 101;')
    expect(confirmDialogRule).not.toContain('z-index: 101;')
  })

  it('keeps the shortcut table contained on narrow viewports', () => {
    const rootCss = appCss()
    const css = overlaysCss()
    const captionRule = css.match(/\.help-dialog caption\s*\{[^}]+\}/)?.[0] ?? ''
    const bodyCellRule = css.match(/\.help-dialog tbody th,\s*\.help-dialog td\s*\{[^}]+\}/)?.[0] ?? ''
    const kbdRule = css.match(/\.help-dialog kbd\s*\{[^}]+\}/)?.[0] ?? ''

    expect(rootCss).toContain('--sheet-font-weight-base: 400;')
    expect(rootCss).toContain('--sheet-size-visually-hidden: 1px;')
    expect(rootCss).toContain('--sheet-offset-visually-hidden: -1px;')
    expect(rootCss).toContain('--sheet-size-shortcut-key-border: 1px;')
    expect(css).toContain('.help-dialog table { border-collapse: collapse; width: 100%; table-layout: fixed; }')
    expect(captionRule).toContain('width: var(--sheet-size-visually-hidden, 1px);')
    expect(captionRule).toContain('height: var(--sheet-size-visually-hidden, 1px);')
    expect(captionRule).toContain('margin: var(--sheet-offset-visually-hidden, -1px);')
    expect(captionRule).toContain('clip: rect(0 0 0 0);')
    expect(css).toContain('.help-dialog th, .help-dialog td { padding: var(--sheet-space-1, 4px) var(--sheet-space-3, 8px); text-align: left; overflow-wrap: anywhere; }')
    expect(bodyCellRule).toContain('font-weight: var(--sheet-font-weight-base, 400);')
    expect(bodyCellRule).not.toContain('font-weight: normal;')
    expect(kbdRule).toContain('border: var(--sheet-size-shortcut-key-border, 1px) solid var(--sheet-color-border, #dadce0);')
    expect(css).toContain('font-size: var(--sheet-font-size-sm, 12px); white-space: normal;')
  })

  it('keeps the close action contained inside the help dialog', () => {
    const css = overlaysCss()
    const closeButtonRule = css.match(/\.help-dialog button\s*\{[^}]+\}/)?.[0] ?? ''

    expect(closeButtonRule).toContain('margin-top: var(--sheet-space-5, 12px);')
    expect(closeButtonRule).toContain('max-width: 100%;')
    expect(closeButtonRule).toContain('overflow-wrap: anywhere;')
  })
})
