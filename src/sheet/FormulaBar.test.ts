import { act, createElement, type KeyboardEvent } from 'react'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { keyDown, setInputValue, setupReactDOM } from './test-utils'
import { FormulaBar } from './FormulaBar'

const appCss = () => readFileSync('src/App.css', 'utf8')

describe('FormulaBar', () => {
  const dom = setupReactDOM()

  it('exposes accessible names for the address control and formula input', () => {
    act(() => dom.root.render(createElement(FormulaBar, {
      addr: 'B12',
      value: '=SUM(B2:B11)',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: true,
      canRedo: true,
      onAddrClick: vi.fn(),
    })))

    expect(document.querySelector('.sheet-toolbar')?.getAttribute('role')).toBe('toolbar')
    expect(document.querySelector('.sheet-toolbar')?.getAttribute('aria-label')).toBe('스프레드시트 도구 모음')
    expect(document.querySelector('button.addr')?.getAttribute('aria-label')).toBe('B12 셀로 이동')
    expect(document.querySelector('button.addr')?.getAttribute('title')).toBe('셀로 이동 (Ctrl/⌘+G)')
    expect(document.querySelector('button.addr')?.getAttribute('aria-keyshortcuts')).toBe('Control+G Meta+G')
    expect(document.querySelector('input.formula')?.getAttribute('aria-label')).toBe('B12 셀 수식 입력줄')
    expect(document.querySelector('input.formula')?.getAttribute('aria-keyshortcuts')).toBe('Enter Escape F4')
    expect(document.querySelector('input.formula')?.getAttribute('title')).toBe('B12 셀 수식 입력줄 (Enter=적용 / Esc=취소 / F4=참조 형식 순환)')
    expect(document.querySelector('button[aria-label="실행 취소"]')?.textContent).toBe('실행 취소')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')?.type).toBe('button')
    expect(document.querySelector('button[aria-label="실행 취소"]')?.getAttribute('title')).toBe('실행 취소 (Ctrl/⌘+Z)')
    expect(document.querySelector('button[aria-label="실행 취소"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Z Meta+Z')
    expect(document.querySelector('button[aria-label="다시 실행"]')?.textContent).toBe('다시 실행')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')?.type).toBe('button')
    expect(document.querySelector('button[aria-label="다시 실행"]')?.getAttribute('title')).toBe('다시 실행 (Ctrl/⌘+Shift+Z)')
    expect(document.querySelector('button[aria-label="다시 실행"]')?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+Z Meta+Shift+Z')
  })

  it('keeps the toolbar title and address controls stable while the formula input flexes', () => {
    const css = appCss()
    const titleRule = css.match(/\.sheet-toolbar > strong\s*\{[^}]+\}/)?.[0] ?? ''
    const addressRule = css.match(/\.sheet-toolbar \.addr\s*\{[^}]+\}/)?.[0] ?? ''
    const formulaRule = css.match(/\.sheet-toolbar \.formula\s*\{[^}]+\}/)?.[0] ?? ''

    expect(titleRule).toContain('flex: 0 0 auto;')
    expect(titleRule).toContain('min-width: 0;')
    expect(titleRule).toContain('max-width: min(100%, var(--sheet-size-toolbar-button-max, 96px));')
    expect(titleRule).toContain('overflow: hidden;')
    expect(titleRule).toContain('text-overflow: ellipsis;')
    expect(titleRule).toContain('white-space: nowrap;')
    expect(addressRule).toContain('flex: 0 0 auto;')
    expect(addressRule).toContain('min-width: 56px;')
    expect(formulaRule).toContain('flex: 1 1 200px;')
    expect(formulaRule).toContain('min-width: 0;')
    expect(formulaRule).toContain('max-width: 100%;')
  })

  it('keeps the address control disabled when no jump action is available', () => {
    act(() => dom.root.render(createElement(FormulaBar, {
      addr: null,
      value: '',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
    })))

    const address = document.querySelector<HTMLButtonElement>('button.addr')
    expect(address?.disabled).toBe(true)
    expect(address?.textContent).toBe('—')
    expect(address?.getAttribute('aria-label')).toBe('선택된 셀 없음')
    expect(address?.getAttribute('title')).toBe('선택된 셀 없음')
    expect(address?.hasAttribute('aria-keyshortcuts')).toBe(false)
    const formula = document.querySelector<HTMLInputElement>('input.formula')
    expect(formula?.disabled).toBe(true)
    expect(formula?.placeholder).toBe('값 또는 =A1+B1')
    expect(formula?.getAttribute('aria-label')).toBe('수식 입력줄, 선택된 셀 없음')
    expect(formula?.getAttribute('title')).toBe('수식 입력줄, 선택된 셀 없음')
    expect(formula?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소할 작업 없음"]')?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소할 작업 없음"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소할 작업 없음"]')?.getAttribute('title')).toBe('실행 취소할 작업 없음')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소할 작업 없음"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행할 작업 없음"]')?.disabled).toBe(true)
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행할 작업 없음"]')?.type).toBe('button')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행할 작업 없음"]')?.getAttribute('title')).toBe('다시 실행할 작업 없음')
    expect(document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행할 작업 없음"]')?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('clarifies the address control when Go To is available without a selected address', () => {
    const onAddrClick = vi.fn()

    act(() => dom.root.render(createElement(FormulaBar, {
      addr: null,
      value: '',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
      onAddrClick,
    })))

    const address = document.querySelector<HTMLButtonElement>('button.addr')
    expect(address?.disabled).toBe(false)
    expect(address?.textContent).toBe('—')
    expect(address?.getAttribute('aria-label')).toBe('셀 또는 범위로 이동')
    expect(address?.getAttribute('title')).toBe('셀 또는 범위로 이동 (Ctrl/⌘+G)')
    expect(address?.getAttribute('aria-keyshortcuts')).toBe('Control+G Meta+G')

    act(() => address!.click())

    expect(onAddrClick).toHaveBeenCalledTimes(1)
  })

  it('describes the current address without a jump action when address jumping is unavailable', () => {
    act(() => dom.root.render(createElement(FormulaBar, {
      addr: 'C3',
      value: '42',
      onCommit: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
    })))

    const address = document.querySelector<HTMLButtonElement>('button.addr')
    expect(address?.disabled).toBe(true)
    expect(address?.textContent).toBe('C3')
    expect(address?.getAttribute('aria-label')).toBe('C3 셀 주소')
    expect(address?.getAttribute('title')).toBe('C3 셀 주소')
    expect(address?.hasAttribute('aria-keyshortcuts')).toBe(false)
  })

  it('keeps button activation keys inside the formula bar controls', () => {
    const onAddrClick = vi.fn()
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const parentKeys: string[] = []

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(FormulaBar, {
        addr: 'C3',
        value: '42',
        onCommit: vi.fn(),
        onUndo,
        onRedo,
        canUndo: true,
        canRedo: true,
        onAddrClick,
      }),
    )))

    const address = document.querySelector<HTMLButtonElement>('button.addr')!
    const undo = document.querySelector<HTMLButtonElement>('button[aria-label="실행 취소"]')!
    const redo = document.querySelector<HTMLButtonElement>('button[aria-label="다시 실행"]')!

    act(() => keyDown(address, 'Enter'))
    act(() => keyDown(undo, ' '))
    act(() => keyDown(redo, 'Enter'))

    expect(parentKeys).toEqual([])

    act(() => address.click())
    act(() => undo.click())
    act(() => redo.click())

    expect(onAddrClick).toHaveBeenCalledTimes(1)
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('keeps formula input editing keys inside the formula input', () => {
    const parentKeys: string[] = []
    const onCommit = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(FormulaBar, {
        addr: 'A1',
        value: '=B1',
        onCommit,
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: false,
        canRedo: false,
      }),
    )))

    const formula = document.querySelector<HTMLInputElement>('input.formula')!

    expect(formula.getAttribute('aria-label')).toBe('A1 셀 수식 입력줄')
    expect(formula.getAttribute('aria-keyshortcuts')).toBe('Enter Escape F4')
    expect(formula.getAttribute('title')).toBe('A1 셀 수식 입력줄 (Enter=적용 / Esc=취소 / F4=참조 형식 순환)')

    act(() => formula.focus())
    act(() => keyDown(formula, 'ArrowLeft'))
    act(() => keyDown(formula, 'x'))

    const f4 = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'F4' })
    act(() => formula.dispatchEvent(f4))

    expect(f4.defaultPrevented).toBe(true)
    expect(formula.value).toBe('=$B$1')

    act(() => setInputValue(formula, '=C1'))
    act(() => keyDown(formula, 'Escape'))

    expect(formula.value).toBe('=B1')
    expect(onCommit).not.toHaveBeenCalled()
    expect(parentKeys).toEqual([])
  })

  it('prevents Enter from submitting an enclosing form while committing the draft', () => {
    const onSubmit = vi.fn((e: SubmitEvent) => e.preventDefault())
    const onCommit = vi.fn()

    act(() => dom.root.render(createElement('form', { onSubmit }, createElement(FormulaBar, {
      addr: 'A1',
      value: 'old',
      onCommit,
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
    }))))

    const formula = document.querySelector<HTMLInputElement>('input.formula')!

    act(() => {
      formula.focus()
      setInputValue(formula, 'next')
    })

    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    act(() => formula.dispatchEvent(enter))

    expect(enter.defaultPrevented).toBe(true)
    expect(onCommit).toHaveBeenCalledWith('next')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('skips formula input commits when the draft is unchanged', () => {
    const onCommit = vi.fn()

    act(() => dom.root.render(createElement(FormulaBar, {
      addr: 'A1',
      value: 'same',
      onCommit,
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      canUndo: false,
      canRedo: false,
    })))

    const formula = document.querySelector<HTMLInputElement>('input.formula')!

    act(() => {
      formula.focus()
      formula.blur()
    })
    expect(onCommit).not.toHaveBeenCalled()

    act(() => formula.focus())
    act(() => keyDown(formula, 'Enter'))

    expect(onCommit).not.toHaveBeenCalled()
  })

  it('keeps formula input Enter local while committing the draft', () => {
    const parentKeys: string[] = []
    const onCommit = vi.fn()

    act(() => dom.root.render(createElement(
      'div',
      { onKeyDown: (event: KeyboardEvent) => parentKeys.push(event.key) },
      createElement(FormulaBar, {
        addr: 'A1',
        value: 'old',
        onCommit,
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: false,
        canRedo: false,
      }),
    )))

    const formula = document.querySelector<HTMLInputElement>('input.formula')!

    act(() => {
      formula.focus()
      setInputValue(formula, 'next')
    })
    act(() => keyDown(formula, 'Enter'))

    expect(onCommit).toHaveBeenCalledWith('next')
    expect(parentKeys).toEqual([])
  })
})
