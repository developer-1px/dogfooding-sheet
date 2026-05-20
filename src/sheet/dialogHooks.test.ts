import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useConfirm, type Confirm } from './useConfirm'
import { usePrompt, type Ask } from './usePrompt'
import { setInputValue } from './test-utils'

describe('dialog hooks', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot> | null

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
  })

  afterEach(() => {
    if (root) act(() => root?.unmount())
    root = null
    host.remove()
  })

  it('settles a pending prompt when a newer prompt replaces it', async () => {
    let ask!: Ask
    function Harness() {
      const prompt = usePrompt()
      ask = prompt.ask
      return createElement('div', null, prompt.dialog)
    }

    act(() => root!.render(createElement(Harness)))
    let first!: Promise<string | null>
    act(() => { first = ask({ label: '첫 입력' }) })
    let second!: Promise<string | null>
    act(() => { second = ask({ label: '다음 입력' }) })

    await expect(first).resolves.toBeNull()
    expect(document.body.textContent).toContain('다음 입력')

    const input = document.querySelector<HTMLInputElement>('.prompt-dialog input')
    expect(input).not.toBeNull()
    act(() => setInputValue(input!, 'ok'))
    const submit = document.querySelector<HTMLButtonElement>('.prompt-dialog .primary')
    expect(submit).not.toBeNull()
    act(() => submit!.click())

    await expect(second).resolves.toBe('ok')
  })

  it('settles a pending confirm when a newer confirm replaces it', async () => {
    let confirm!: Confirm
    function Harness() {
      const confirmation = useConfirm()
      confirm = confirmation.confirm
      return createElement('div', null, confirmation.dialog)
    }

    act(() => root!.render(createElement(Harness)))
    let first!: Promise<boolean>
    act(() => { first = confirm({ message: '첫 확인' }) })
    let second!: Promise<boolean>
    act(() => { second = confirm({ message: '다음 확인' }) })

    await expect(first).resolves.toBe(false)
    expect(document.body.textContent).toContain('다음 확인')

    const ok = document.querySelector<HTMLButtonElement>('.confirm-dialog .danger')
    expect(ok).not.toBeNull()
    act(() => ok!.click())

    await expect(second).resolves.toBe(true)
  })

  it('settles pending dialogs on unmount', async () => {
    let ask!: Ask
    let confirm!: Confirm
    function Harness() {
      const prompt = usePrompt()
      const confirmation = useConfirm()
      ask = prompt.ask
      confirm = confirmation.confirm
      return createElement('div', null, prompt.dialog, confirmation.dialog)
    }

    act(() => root!.render(createElement(Harness)))
    let promptResult!: Promise<string | null>
    let confirmResult!: Promise<boolean>
    act(() => {
      promptResult = ask({ label: '입력' })
      confirmResult = confirm({ message: '확인' })
    })
    act(() => {
      root!.unmount()
      root = null
    })

    await expect(promptResult).resolves.toBeNull()
    await expect(confirmResult).resolves.toBe(false)
  })
})
