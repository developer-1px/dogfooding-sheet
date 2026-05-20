import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppErrorBoundary } from './AppErrorBoundary'

function Ok() {
  return createElement('div', null, 'ok')
}

describe('AppErrorBoundary', () => {
  let host: HTMLDivElement
  let root: ReturnType<typeof createRoot>

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

  it('contains render failures and can retry', () => {
    let fail = true
    function MaybeThrow() {
      if (fail) throw new Error('render failed')
      return createElement(Ok)
    }

    act(() => {
      root.render(createElement(AppErrorBoundary, null, createElement(MaybeThrow)))
    })

    expect(document.querySelector('[role="alert"]')?.textContent).toContain('화면을 표시하지 못했습니다.')

    fail = false
    const retry = document.querySelector<HTMLButtonElement>('.app-error button')
    expect(retry).not.toBeNull()
    act(() => retry!.click())

    expect(document.querySelector('[role="alert"]')).toBeNull()
    expect(host.textContent).toBe('ok')
  })
})
