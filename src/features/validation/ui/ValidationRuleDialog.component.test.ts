import { act, createElement, type ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { keyDown, mouseClick, setInputValue, setupReactDOM } from '../../../shared/testing/test-utils'
import { ValidationRuleDialog } from './ValidationRuleDialog'

describe('ValidationRuleDialog', () => {
  const dom = setupReactDOM()

  const renderDialog = (overrides: Partial<ComponentProps<typeof ValidationRuleDialog>> = {}) => {
    const props: ComponentProps<typeof ValidationRuleDialog> = {
      open: true,
      targetLabel: 'B2',
      targetKeys: ['B2'],
      rules: { B2: { type: 'list', options: ['Open', 'Closed'] } },
      setListRule: vi.fn(),
      setCheckboxRule: vi.fn(),
      clearRule: vi.fn(),
      onClose: vi.fn(),
      ...overrides,
    }
    act(() => dom.root.render(createElement(ValidationRuleDialog, props)))
    return props
  }

  it('prefills and applies a common dropdown rule', () => {
    const props = renderDialog()

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const listMode = document.querySelector<HTMLInputElement>('input[type="radio"][value="list"]')
    const options = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="드롭다운 항목"]')
    const apply = document.querySelector<HTMLButtonElement>('button[aria-label="B2 데이터 유효성 적용"]')

    expect(dialog?.getAttribute('aria-label')).toBe('B2 데이터 유효성')
    expect(listMode?.checked).toBe(true)
    expect(options?.value).toBe('Open\nClosed')

    act(() => setInputValue(options!, ' Open \nPending\nOpen'))
    act(() => mouseClick(apply!))

    expect(props.setListRule).toHaveBeenCalledWith(['B2'], ['Open', 'Pending'])
    expect(props.setCheckboxRule).not.toHaveBeenCalled()
    expect(props.clearRule).not.toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it('requires an explicit rule choice for mixed targets', () => {
    renderDialog({
      targetLabel: '선택 셀 2개',
      targetKeys: ['B2', 'C2'],
      rules: {
        B2: { type: 'checkbox' },
        C2: { type: 'list', options: ['Open'] },
      },
    })

    const radios = [...document.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
    const apply = document.querySelector<HTMLButtonElement>('button[aria-label="선택 셀 2개 데이터 유효성 적용"]')

    expect(document.querySelector('[role="status"]')?.textContent).toBe('선택 영역에 여러 검증 규칙이 있습니다.')
    expect(radios.every((radio) => !radio.checked)).toBe(true)
    expect(apply?.disabled).toBe(true)

    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="checkbox"]')!))

    expect(document.querySelector<HTMLInputElement>('input[value="checkbox"]')?.checked).toBe(true)
    expect(document.querySelector('[role="status"]')).toBeNull()
    expect(apply?.disabled).toBe(false)
  })

  it('requires at least one normalized dropdown option', () => {
    renderDialog({ rules: {} })

    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="list"]')!))

    const options = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="드롭다운 항목"]')
    const apply = document.querySelector<HTMLButtonElement>('button[aria-label="B2 데이터 유효성 적용"]')
    expect(options?.getAttribute('aria-invalid')).toBe('true')
    expect(document.querySelector('.validation-error')?.textContent).toBe('항목을 한 개 이상 입력하세요.')
    expect(apply?.disabled).toBe(true)

    act(() => setInputValue(options!, 'Open'))

    expect(options?.hasAttribute('aria-invalid')).toBe(false)
    expect(apply?.disabled).toBe(false)
  })

  it('applies checkbox conversion through the existing validation action', () => {
    const props = renderDialog({ rules: {} })

    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="checkbox"]')!))
    act(() => mouseClick(document.querySelector<HTMLButtonElement>('button[aria-label="B2 데이터 유효성 적용"]')!))

    expect(props.setCheckboxRule).toHaveBeenCalledWith(['B2'])
    expect(props.setListRule).not.toHaveBeenCalled()
    expect(props.clearRule).not.toHaveBeenCalled()
  })

  it('clears validation without applying another rule', () => {
    const props = renderDialog({ rules: { B2: { type: 'checkbox' } } })

    act(() => mouseClick(document.querySelector<HTMLInputElement>('input[value="none"]')!))
    act(() => mouseClick(document.querySelector<HTMLButtonElement>('button[aria-label="B2 데이터 유효성 적용"]')!))

    expect(props.clearRule).toHaveBeenCalledWith(['B2'])
    expect(props.setCheckboxRule).not.toHaveBeenCalled()
    expect(props.setListRule).not.toHaveBeenCalled()
  })

  it('cancels from Escape or the backdrop without changing validation', () => {
    const props = renderDialog()
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!

    act(() => keyDown(dialog, 'Escape'))
    act(() => mouseClick(document.querySelector<HTMLElement>('.dialog-backdrop')!))

    expect(props.onClose).toHaveBeenCalledTimes(2)
    expect(props.setListRule).not.toHaveBeenCalled()
    expect(props.setCheckboxRule).not.toHaveBeenCalled()
    expect(props.clearRule).not.toHaveBeenCalled()
  })
})
